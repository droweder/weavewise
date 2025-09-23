import { supabase } from '../utils/supabaseClient';
import { ProductionItem, TrainingHistoryEntry, OptimizationLog } from '../types/index';
import * as XLSX from 'xlsx';

// Serviço real de API com integração com Supabase
class RealApiService {
  // Tornar o supabase acessível externamente
  supabase = supabase;

  async optimizeProduction(items: ProductionItem[], tolerance: number): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: modelData, error: modelError } = await supabase
        .from('model_weights')
        .select('weights')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      let result;
      if (modelError || !modelData) {
        // No model found, use rule-based optimization
        result = this.enfestoOptimization(items, tolerance);
      } else {
        // Model found, use hybrid optimization
        result = this.hybridOptimization(items, tolerance, modelData.weights);
      }
      
      await this.logOptimization(user.id, tolerance, items.length, result);
      return result;
    } catch (error) {
      console.error('Erro na otimização:', error);
      throw error;
    }
  }

  private hybridOptimization(items: ProductionItem[], tolerance: number, modelWeights: any) {
    const groups: Record<string, ProductionItem[]> = {};
    items.forEach(item => {
      const key = `${item.referencia}-${item.cor}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    let optimizedItems: ProductionItem[] = [];
    const optimizationDetails: Record<string, any> = {};

    const globalStackHeights = modelWeights.globalStackHeights || [36];

    for (const key in groups) {
      const groupItems = groups[key];
      let bestStackHeight = 1;
      let methodUsed = 'N/A';
      let modelHeightFound = false;

      // 1. Tentar aplicar as alturas de enfesto globais aprendidas
      for (const height of globalStackHeights) {
        let isHeightValid = true;
        for (const item of groupItems) {
          const adjustedQtd = this.adjustToLayers(item.qtd, height);
          const difference = Math.abs(adjustedQtd - item.qtd);
          // A verificação de tolerância só se aplica a itens com quantidade inicial > 0
          if (item.qtd > 0 && (difference / item.qtd) * 100 > tolerance) {
            isHeightValid = false;
            break;
          }
        }

        if (isHeightValid) {
          bestStackHeight = height;
          methodUsed = 'Modelo';
          modelHeightFound = true;
          break; // Encontrou a melhor altura do modelo, pode parar
        }
      }

      // 2. Se nenhuma altura do modelo for válida, usar a regra de tolerância
      if (!modelHeightFound) {
        bestStackHeight = this.findBestStackHeight(groupItems.map(i => i.qtd), tolerance);
        methodUsed = 'Regra de Tolerância';
      }

      // 3. Aplicar a altura de enfesto final escolhida
      const optimizedGroup = groupItems.map(item => {
        if (bestStackHeight > 1) {
          const optimizedQtd = this.adjustToLayers(item.qtd, bestStackHeight);

          let finalOptimizedQtd;
          if (item.qtd === 0) {
            // Se a quantidade original é 0, a otimizada é a altura do enfesto.
            finalOptimizedQtd = bestStackHeight;
          } else {
            // Se a quantidade original não é 0, mas a otimização a arredondou para 0,
            // então a otimizada deve ser a altura do enfesto para evitar zerar o item.
            finalOptimizedQtd = optimizedQtd === 0 ? bestStackHeight : optimizedQtd;
          }

          return {
            ...item,
            qtd_otimizada: finalOptimizedQtd,
            diferenca: finalOptimizedQtd - item.qtd,
          };
        } else {
          // Se a melhor altura for 1, não há otimização
          return { ...item, qtd_otimizada: item.qtd, diferenca: 0 };
        }
      });

      optimizedItems.push(...optimizedGroup);
      optimizationDetails[key] = { bestStackHeight, method: methodUsed };
    }

    const summary = {
      increases: optimizedItems.filter(item => (item.diferenca || 0) > 0).length,
      decreases: optimizedItems.filter(item => (item.diferenca || 0) < 0).length,
      unchanged: optimizedItems.filter(item => (item.diferenca || 0) === 0).length,
      optimizationDetails,
    };

    return { success: true, items: optimizedItems, summary };
  }

  private enfestoOptimization(items: ProductionItem[], tolerance: number) {
    // This is the standalone rule-based optimization
    const groups: Record<string, ProductionItem[]> = {};
    items.forEach(item => {
      const key = `${item.referencia}-${item.cor}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    let optimizedItems: ProductionItem[] = [];
    const optimizationDetails: Record<string, any> = {};

    for (const key in groups) {
        const groupItems = groups[key];
        const groupQuantities = groupItems.map(i => i.qtd);
        const bestStackHeight = this.findBestStackHeight(groupQuantities, tolerance);
        optimizationDetails[key] = { bestStackHeight, method: 'Regras' };

        const optimizedGroup = groupItems.map(item => {
          if (bestStackHeight > 1) {
            const optimizedQtd = Math.round(item.qtd / bestStackHeight) * bestStackHeight;

            let finalOptimizedQtd;
            if (item.qtd === 0) {
              // Se a quantidade original é 0, a otimizada é a altura do enfesto.
              finalOptimizedQtd = bestStackHeight;
            } else {
              // Se a quantidade original não é 0, mas a otimização a arredondou para 0,
              // então a otimizada deve ser a altura do enfesto para evitar zerar o item.
              finalOptimizedQtd = optimizedQtd === 0 ? bestStackHeight : optimizedQtd;
            }

            return {
              ...item,
              qtd_otimizada: finalOptimizedQtd,
              diferenca: finalOptimizedQtd - item.qtd,
            };
          } else {
            // Se a melhor altura for 1, não há otimização
            return { ...item, qtd_otimizada: item.qtd, diferenca: 0 };
          }
        });
        optimizedItems.push(...optimizedGroup);
    }

    const summary = {
      increases: optimizedItems.filter(item => (item.diferenca || 0) > 0).length,
      decreases: optimizedItems.filter(item => (item.diferenca || 0) < 0).length,
      unchanged: optimizedItems.filter(item => (item.diferenca || 0) === 0).length,
      optimizationDetails,
    };

    return { success: true, items: optimizedItems, summary };
  }

  private findBestStackHeight(quantities: number[], tolerance: number): number {
    const gcdHeight = this.gcdMultiple(quantities.filter(q => q > 0));

    // Se o MDC for 1 ou menos, não há um padrão de agrupamento natural.
    if (gcdHeight <= 1) {
      return 1;
    }

    // Validar se a altura do MDC respeita a tolerância para todos os itens.
    let isGcdValid = true;
    for (const qtd of quantities) {
      if (qtd > 0) {
        const adjustedQtd = Math.round(qtd / gcdHeight) * gcdHeight;
        const difference = Math.abs(adjustedQtd - qtd);
        if ((difference / qtd) * 100 > tolerance) {
          isGcdValid = false;
          break;
        }
      }
    }

    // Retornar a altura do MDC apenas se for válida, caso contrário, não otimizar.
    return isGcdValid ? gcdHeight : 1;
  }

  // Calcular MDC (Máximo Divisor Comum) entre dois números
  private gcd(a: number, b: number): number {
    return b === 0 ? a : this.gcd(b, a % b);
  }

  // Calcular MDC de uma lista de números
  private gcdMultiple(numbers: number[]): number {
    if (numbers.length === 0) return 1;
    if (numbers.length === 1) return numbers[0];
    
    let result = numbers[0];
    for (let i = 1; i < numbers.length; i++) {
      result = this.gcd(result, numbers[i]);
    }
    return result;
  }

  // Detectar camadas baseado no MDC das quantidades da mesma referência+cor
  private detectLayersFromData(data: any[], referencia: string, cor: string): number {
    // Buscar todas as quantidades otimizadas para a mesma referência+cor
    const quantities = data
      .filter(item => item.referencia === referencia && item.cor === cor)
      .map(item => item.qtd_otimizada);
    
    if (quantities.length === 0) return 36; // Default
    if (quantities.length === 1) return this.detectLayers(quantities[0]);
    
    // Calcular MDC entre todas as quantidades
    const mdc = this.gcdMultiple(quantities);
    
    // Validar se o MDC faz sentido como número de camadas (entre 6 e 60)
    if (mdc >= 6 && mdc <= 60) {
      return mdc;
    }
    
    // Se MDC não faz sentido, usar detecção individual
    return this.detectLayers(quantities[0]);
  }

  // Detectar número de camadas baseado em múltiplos comuns (fallback)
  private detectLayers(quantity: number): number {
    const commonLayers = [12, 18, 24, 30, 36, 42, 48]; // Camadas típicas na indústria têxtil
    
    for (const layers of commonLayers) {
      if (quantity % layers === 0) {
        return layers;
      }
    }
    
    // Buscar o maior divisor entre 6 e 60
    for (let i = 60; i >= 6; i--) {
      if (quantity % i === 0) {
        return i;
      }
    }
    
    return Math.max(1, Math.round(quantity / 36)); // Default: aproximar para múltiplo de 36
  }

  // Ajustar quantidade para o múltiplo mais próximo das camadas
  private adjustToLayers(quantity: number, layers: number): number {
    if (layers <= 0) return quantity;
    return Math.round(quantity / layers) * layers;
  }

  // Encontrar exemplo com tamanho mais próximo
  private findClosestSizeExample(item: ProductionItem, examples: any[]): any | null {
    // Implementação simples - retorna o primeiro exemplo para agora
    return examples && examples.length > 0 ? examples[0] : null;
  }



  private extractItemFeatures(item: ProductionItem): number[] {
    // Extrair características numéricas do item para machine learning
    return [
      item.qtd,
      this.hashString(item.referencia) % 1000 / 1000, // Hash normalizado da referência
      this.hashString(item.cor) % 1000 / 1000,        // Hash normalizado da cor
      this.hashString(item.tamanho) % 1000 / 1000,    // Hash normalizado do tamanho
      item.qtd > 100 ? 1 : 0,                         // Flag para quantidade alta
      item.qtd < 10 ? 1 : 0                          // Flag para quantidade baixa
    ];
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Converter para 32bit integer
    }
    return Math.abs(hash);
  }

  private getQuantityRange(qtd: number): string {
    if (qtd <= 10) return 'very_low';
    if (qtd <= 25) return 'low';
    if (qtd <= 50) return 'medium_low';
    if (qtd <= 100) return 'medium';
    if (qtd <= 250) return 'medium_high';
    if (qtd <= 500) return 'high';
    return 'very_high';
  }

  private applyLinearRegression(features: number[], regression: any): number {
    const coefficients = regression.coefficients;
    const intercept = regression.intercept || 0;
    
    let prediction = intercept;
    for (let i = 0; i < Math.min(features.length, coefficients.length); i++) {
      prediction += features[i] * coefficients[i];
    }
    
    return Math.max(1, prediction);
  }

  private async logOptimization(
    userId: string, 
    tolerance: number, 
    linesProcessed: number, 
    result: any
  ) {
    const summary = result.summary;

    await supabase
      .from('optimization_logs')
      .insert([
        {
          user_id: userId,
          timestamp: new Date().toISOString(),
          tolerance,
          lines_processed: linesProcessed,
          summary
        }
      ]);
  }

  async trainModel(file: File): Promise<{ success: boolean; message: string; modelVersion?: string }> {
    try {
      // Obter o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Registrar início da sessão de treinamento
      const { data: session, error: sessionError } = await supabase
        .from('training_sessions')
        .insert([
          {
            user_id: user.id,
            status: 'Em andamento',
            start_time: new Date().toISOString(),
            model_version: `v${Date.now()}`
          }
        ])
        .select()
        .single();

      if (sessionError) throw sessionError;

      try {
        // Processar o arquivo Excel
        const trainingData = await this.processTrainingFile(file);
        
        // Salvar dados de treinamento
        await supabase
          .from('training_data')
          .insert([
            {
              user_id: user.id,
              data: trainingData
            }
          ]);

        // Treinar o modelo (simplificado)
        const modelWeights = await this.trainMLModel(trainingData);
        
        // Salvar pesos do modelo
        const modelVersion = `v${Date.now()}`;
        await supabase
          .from('model_weights')
          .insert([
            {
              user_id: user.id,
              version: modelVersion,
              weights: modelWeights,
              is_active: true
            }
          ]);

        // Desativar modelos antigos
        await supabase
          .from('model_weights')
          .update({ is_active: false })
          .neq('version', modelVersion)
          .eq('user_id', user.id);

        // Atualizar sessão de treinamento
        await supabase
          .from('training_sessions')
          .update({
            status: 'Sucesso',
            end_time: new Date().toISOString(),
            examples_processed: trainingData.length
          })
          .eq('id', session.id);

        return {
          success: true,
          message: 'Modelo treinado com sucesso',
          modelVersion
        };
      } catch (error) {
        // Registrar falha na sessão de treinamento
        await supabase
          .from('training_sessions')
          .update({
            status: 'Falha',
            end_time: new Date().toISOString(),
            error_message: (error as Error).message
          })
          .eq('id', session.id);

        throw error;
      }
    } catch (error) {
      console.error('Erro no treinamento:', error);
      return {
        success: false,
        message: 'Erro ao processar arquivo de treinamento: ' + (error as Error).message
      };
    }
  }

  private async processTrainingFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Procurar pela aba "Dados"
          const sheetName = workbook.SheetNames.find(name => 
            name.toLowerCase().includes('dados')
          ) || workbook.SheetNames[0];
          
          if (!sheetName) {
            throw new Error('Aba "Dados" não encontrada');
          }
          
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Erro ao ler arquivo'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  private async trainMLModel(data: any[]): Promise<any> {
    console.log('Iniciando treinamento do modelo com lógica de padrão global com', data.length, 'exemplos');

    // 1. Validar e limpar dados
    const cleanedData = this.validateAndCleanTrainingData(data);
    console.log('Dados limpos:', cleanedData.length, 'exemplos válidos');

    if (cleanedData.length === 0) {
      throw new Error('Nenhum dado válido encontrado para treinamento.');
    }

    // 2. Coletar todas as quantidades otimizadas de todo o dataset
    const allOptimizedQuantities = cleanedData.map(item => item.qtd_otimizada).filter(q => q > 0);

    if (allOptimizedQuantities.length === 0) {
        throw new Error('Nenhuma quantidade otimizada válida encontrada nos dados de treinamento.');
    }

    // 3. Identificar as "alturas de enfesto" mais comuns e eficazes globalmente
    const candidateHeights = [12, 18, 24, 30, 36, 42, 48, 54, 60, 72, 84, 96, 108, 120, 144];
    const heightFrequencies: Record<number, number> = {};

    // Contar a frequência de cada altura candidata como divisor das quantidades otimizadas
    allOptimizedQuantities.forEach(qtd => {
        for (const height of candidateHeights) {
            // Consideramos um divisor se a "sobra" for pequena (ex: menos de 5%)
            if ((qtd % height) < (height * 0.05)) {
                heightFrequencies[height] = (heightFrequencies[height] || 0) + 1;
            }
        }
    });
    
    // 4. Ordenar as alturas pela sua frequência para determinar as mais eficazes
    const globalStackHeights = Object.entries(heightFrequencies)
      .sort(([, countA], [, countB]) => countB - countA)
      .map(([height]) => parseInt(height));

    // Garantir que temos um fallback caso nenhuma altura seja encontrada
    if (globalStackHeights.length === 0) {
        globalStackHeights.push(36); // Fallback padrão da indústria
    }

    console.log('Alturas de enfesto globais aprendidas (ordenadas por eficácia):', globalStackHeights);

    // 5. Retornar os novos pesos do modelo com o padrão global
    return {
      globalStackHeights,
      sample_size: cleanedData.length,
      trained_at: new Date().toISOString(),
      version: 'v6.0-global-pattern',
    };
  }

  private analyzeReferenceColorPatterns(data: any[]) {
    const patterns: Record<string, any> = {};
    
    // Agrupar por referência+cor
    data.forEach(item => {
      const key = `${item.referencia}-${item.cor}`;
      
      if (!patterns[key]) {
        patterns[key] = {
          examples: [],
          count: 0,
          quantities: [],
          avgOptimizedQtd: 0,
          mdc: 0
        };
      }
      
      patterns[key].examples.push(item);
      patterns[key].count++;
      patterns[key].quantities.push(item.qtd_otimizada);
    });
    
    // Calcular MDC e médias para cada padrão
    Object.keys(patterns).forEach(key => {
      const pattern = patterns[key];
      pattern.mdc = this.gcdMultiple(pattern.quantities);
      pattern.avgOptimizedQtd = pattern.quantities.reduce((a: number, b: number) => a + b, 0) / pattern.quantities.length;
      
      // Validar se MDC é um valor razoável para camadas
      if (pattern.mdc < 6 || pattern.mdc > 60) {
        pattern.mdc = this.detectLayers(pattern.avgOptimizedQtd);
      }
    });
    
    return patterns;
  }

  private analyzeExactPatterns(data: any[]) {
    const patterns: Record<string, any> = {};
    
    // Agrupar por combinação exata de referência+tamanho+cor
    data.forEach((item: any) => {
      const key = `${item.referencia}-${item.tamanho}-${item.cor}`;
      
      if (!patterns[key]) {
        patterns[key] = {
          referencia: item.referencia,
          tamanho: item.tamanho,
          cor: item.cor,
          examples: [],
          totalOriginal: 0,
          totalOptimized: 0,
          count: 0
        };
      }
      
      patterns[key].examples.push({
        qtd: item.qtd,
        qtd_otimizada: item.qtd_otimizada,
        ratio: item.adjustment_ratio
      });
      patterns[key].totalOriginal += item.qtd;
      patterns[key].totalOptimized += item.qtd_otimizada;
      patterns[key].count++;
    });
    
    // Calcular estatísticas para cada padrão exato
    Object.keys(patterns).forEach(key => {
      const pattern = patterns[key];
      pattern.avgOriginalQtd = pattern.totalOriginal / pattern.count;
      pattern.avgOptimizedQtd = pattern.totalOptimized / pattern.count;
      pattern.avgAdjustmentRatio = pattern.avgOptimizedQtd / pattern.avgOriginalQtd;
      
      // Para padrões exatos, alta confiança mesmo com poucos exemplos
      pattern.confidence = Math.min(pattern.count / 3, 1.0);
      
      // Calcular variabilidade das otimizações
      const ratios = pattern.examples.map((ex: any) => ex.ratio);
      pattern.variability = this.calculateVariance(ratios);
      
      // Manter apenas um exemplo representativo para economizar espaço
      pattern.representativeExample = pattern.examples[0];
      delete pattern.examples;
    });
    
    return patterns;
  }

  private analyzeLayers(data: any[]) {
    const layerCounts: Record<number, number> = {};
    const referenceLayerPatterns: Record<string, any> = {};
    const referenceColorGroups: Record<string, any[]> = {};
    
    // Agrupar dados por referência+cor para calcular MDC
    data.forEach((item: any) => {
      const key = `${item.referencia}-${item.cor}`;
      if (!referenceColorGroups[key]) {
        referenceColorGroups[key] = [];
      }
      referenceColorGroups[key].push(item);
    });
    
    // Calcular MDC para cada grupo referência+cor
    Object.keys(referenceColorGroups).forEach(key => {
      const items = referenceColorGroups[key];
      const [referencia] = key.split('-');
      
      // Coletar todas as quantidades otimizadas do grupo
      const quantities = items.map(item => item.qtd_otimizada);
      
      // Calcular MDC das quantidades
      const mdc = this.gcdMultiple(quantities);
      
      // Validar se o MDC faz sentido como camadas (entre 6 e 60)
      const layers = (mdc >= 6 && mdc <= 60) ? mdc : this.detectLayers(quantities[0]);
      
      // Registrar o padrão de camadas
      layerCounts[layers] = (layerCounts[layers] || 0) + items.length;
      
      // Agrupar por referência
      if (!referenceLayerPatterns[referencia]) {
        referenceLayerPatterns[referencia] = {
          layerCounts: {},
          totalItems: 0,
          layerPattern: null
        };
      }
      
      const refPattern = referenceLayerPatterns[referencia];
      refPattern.layerCounts[layers] = (refPattern.layerCounts[layers] || 0) + items.length;
      refPattern.totalItems += items.length;
    });
    
    // Encontrar camadas mais comuns globalmente
    const mostCommonLayers = Object.keys(layerCounts)
      .map(layers => ({ layers: parseInt(layers), count: layerCounts[parseInt(layers)] }))
      .sort((a, b) => b.count - a.count)[0];
    
    // Calcular padrão de camadas por referência
    Object.keys(referenceLayerPatterns).forEach(ref => {
      const pattern = referenceLayerPatterns[ref];
      const mostCommon = Object.keys(pattern.layerCounts)
        .map(layers => ({ layers: parseInt(layers), count: pattern.layerCounts[parseInt(layers)] }))
        .sort((a, b) => b.count - a.count)[0];
      
      pattern.mostCommonLayers = mostCommon ? mostCommon.layers : 36;
      pattern.confidence = mostCommon ? mostCommon.count / pattern.totalItems : 0;
    });
    
    return {
      globalPattern: {
        mostCommonLayers: mostCommonLayers ? mostCommonLayers.layers : 36,
        confidence: mostCommonLayers ? mostCommonLayers.count / data.length : 0
      },
      referencePatterns: referenceLayerPatterns
    };
  }
  
  private validateAndCleanTrainingData(data: any[]) {
    console.log('Dados brutos recebidos:', data.length, 'itens');
    if (data.length > 0) {
      console.log('Exemplo de item bruto:', JSON.stringify(data[0], null, 2));
      console.log('Campos disponíveis:', Object.keys(data[0]));
    }

    // Mapear nomes de campos flexivelmente
    const mapFieldNames = (item: any) => {
      const keys = Object.keys(item);
      
      // Buscar referência com variações
      const refKey = keys.find(k => 
        k.toLowerCase().includes('ref') || 
        k.toLowerCase().includes('referencia') ||
        k.toLowerCase() === 'referência'
      );
      
      // Buscar cor
      const corKey = keys.find(k => 
        k.toLowerCase() === 'cor' ||
        k.toLowerCase() === 'color'
      );
      
      // Buscar tamanho 
      const tamanhoKey = keys.find(k => 
        k.toLowerCase() === 'tamanho' ||
        k.toLowerCase() === 'tam' ||
        k.toLowerCase() === 'size'
      );
      
      // Buscar quantidade
      const qtdKey = keys.find(k => 
        k.toLowerCase() === 'qtd' ||
        k.toLowerCase() === 'quantidade' ||
        k.toLowerCase() === 'qty'
      );
      
      // Buscar quantidade otimizada
      const qtdOtimKey = keys.find(k => 
        k.toLowerCase().includes('otim') ||
        k.toLowerCase().includes('optimiz') ||
        k.toLowerCase() === 'qtd_otimizada'
      );

      return {
        referencia: refKey ? item[refKey] : null,
        cor: corKey ? item[corKey] : null,
        tamanho: tamanhoKey ? item[tamanhoKey] : null,
        qtd: qtdKey ? item[qtdKey] : null,
        qtd_otimizada: qtdOtimKey ? item[qtdOtimKey] : null
      };
    };

    const cleanedData = data.map(mapFieldNames).filter(item => {
      // Validar campos obrigatórios
      const hasRequiredFields = 
        item.referencia && 
        item.cor && 
        item.tamanho && 
        typeof item.qtd !== 'undefined' && item.qtd !== null &&
        typeof item.qtd_otimizada !== 'undefined' && item.qtd_otimizada !== null;
      
      if (!hasRequiredFields) {
        console.log('Item rejeitado por campos faltantes:', item);
        return false;
      }
      
      // Converter e validar números
      const qtd = typeof item.qtd === 'number' ? item.qtd : parseFloat(item.qtd);
      const qtdOtimizada = typeof item.qtd_otimizada === 'number' ? 
        item.qtd_otimizada : parseFloat(item.qtd_otimizada);
      
      const isValid = !isNaN(qtd) && !isNaN(qtdOtimizada) && qtd >= 0 && qtdOtimizada >= 0;
      if (!isValid) {
        console.log('Item rejeitado por números inválidos:', { qtd, qtdOtimizada });
      }
      
      return isValid;
    }).map(item => ({
      referencia: String(item.referencia).trim(),
      cor: String(item.cor).trim(),
      tamanho: String(item.tamanho).trim(),
      qtd: typeof item.qtd === 'number' ? item.qtd : parseFloat(item.qtd),
      qtd_otimizada: typeof item.qtd_otimizada === 'number' ? 
        item.qtd_otimizada : parseFloat(item.qtd_otimizada),
      adjustment_ratio: (typeof item.qtd_otimizada === 'number' ? 
        item.qtd_otimizada : parseFloat(item.qtd_otimizada)) / 
        (typeof item.qtd === 'number' ? item.qtd : parseFloat(item.qtd))
    }));

    console.log('Dados limpos finais:', cleanedData.length, 'itens válidos');
    if (cleanedData.length > 0) {
      console.log('Exemplo de item limpo:', cleanedData[0]);
      // Mostrar alguns padrões encontrados
      const referencias = Array.from(new Set(cleanedData.map(item => item.referencia)));
      const cores = Array.from(new Set(cleanedData.map(item => item.cor)));
      const tamanhos = Array.from(new Set(cleanedData.map(item => item.tamanho)));
      
      console.log('Referências encontradas:', referencias.slice(0, 5));
      console.log('Cores encontradas:', cores.slice(0, 5)); 
      console.log('Tamanhos encontrados:', tamanhos.slice(0, 5));
    }

    return cleanedData;
  }
  
  private analyzePatternsByCategory(data: any[], categoryField: string) {
    const patterns: Record<string, any> = {};
    const categoryKey = categoryField.toLowerCase();
    
    // Agrupar por categoria
    data.forEach((item: any) => {
      const category = item[categoryKey];
      if (!patterns[category]) {
        patterns[category] = {
          examples: [],
          totalOriginal: 0,
          totalOptimized: 0,
          count: 0
        };
      }
      
      patterns[category].examples.push(item);
      patterns[category].totalOriginal += item.qtd;
      patterns[category].totalOptimized += item.qtd_otimizada;
      patterns[category].count++;
    });
    
    // Calcular estatísticas para cada categoria
    Object.keys(patterns).forEach(category => {
      const pattern = patterns[category];
      pattern.avgOriginalQtd = pattern.totalOriginal / pattern.count;
      pattern.avgOptimizedQtd = pattern.totalOptimized / pattern.count;
      pattern.avgAdjustmentRatio = pattern.avgOptimizedQtd / pattern.avgOriginalQtd;
      
      // Calcular confiança baseada no número de exemplos
      pattern.confidence = Math.min(pattern.count / 10, 1.0); // Máximo de confiança com 10+ exemplos
      
      // Calcular variabilidade
      const ratios = pattern.examples.map((item: any) => item.adjustment_ratio);
      pattern.variability = this.calculateVariance(ratios);
      
      // Remover arrays para economizar espaço
      delete pattern.examples;
    });
    
    return patterns;
  }
  
  private analyzeQuantityRangePatterns(data: any[]) {
    const ranges: Record<string, any> = {};
    
    data.forEach((item: any) => {
      const range = this.getQuantityRange(item.qtd);
      if (!ranges[range]) {
        ranges[range] = {
          examples: [],
          totalAdjustments: 0,
          count: 0
        };
      }
      
      ranges[range].examples.push(item.adjustment_ratio);
      ranges[range].totalAdjustments += item.adjustment_ratio;
      ranges[range].count++;
    });
    
    Object.keys(ranges).forEach(range => {
      const pattern = ranges[range];
      pattern.avgAdjustmentRatio = pattern.totalAdjustments / pattern.count;
      pattern.confidence = Math.min(pattern.count / 5, 1.0);
      pattern.variability = this.calculateVariance(pattern.examples);
      delete pattern.examples;
    });
    
    return ranges;
  }
  
  private trainLinearRegression(data: any[]) {
    if (data.length < 10) {
      return null; // Não treinar regressão com poucos dados
    }
    
    // Preparar features e target
    const features = data.map((item: any) => this.extractItemFeatures({
      id: `temp-${Math.random()}`,
      referencia: item.referencia,
      cor: item.cor,
      tamanho: item.tamanho,
      qtd: item.qtd
    }));
    
    const targets = data.map(item => item.qtd_otimizada);
    
    // Implementar regressão linear simples usando método dos mínimos quadrados
    const regression = this.calculateLinearRegression(features, targets);
    
    return regression;
  }
  
  private calculateLinearRegression(X: number[][], y: number[]) {
    const n = X.length;
    const numFeatures = X[0].length;
    
    // Adicionar coluna de intercept (bias)
    const XWithIntercept = X.map(row => [1, ...row]);
    
    try {
      // Calcular coeficientes usando método normal: β = (X'X)^(-1)X'y
      const coefficients = this.solveNormalEquation(XWithIntercept, y);
      
      // Calcular R-squared
      const predictions = XWithIntercept.map(row => 
        row.reduce((sum, x, i) => sum + x * coefficients[i], 0)
      );
      
      const rSquared = this.calculateRSquared(y, predictions);
      
      return {
        coefficients: coefficients.slice(1), // Remover intercept dos coeficientes
        intercept: coefficients[0],
        rSquared,
        numFeatures,
        numSamples: n
      };
    } catch (error) {
      console.warn('Erro na regressão linear, usando modelo simplificado:', error);
      return null;
    }
  }
  
  private solveNormalEquation(X: number[][], y: number[]) {
    // Implementação simplificada da equação normal
    // Em um cenário real, usaria bibliotecas como ml-matrix
    
    const n = X.length;
    const m = X[0].length;
    
    // X'X
    const XTX = Array(m).fill(0).map(() => Array(m).fill(0));
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < m; j++) {
        for (let k = 0; k < n; k++) {
          XTX[i][j] += X[k][i] * X[k][j];
        }
      }
    }
    
    // X'y
    const XTy = Array(m).fill(0);
    for (let i = 0; i < m; i++) {
      for (let k = 0; k < n; k++) {
        XTy[i] += X[k][i] * y[k];
      }
    }
    
    // Resolver sistema linear (implementação simplificada)
    return this.solveLinearSystem(XTX, XTy);
  }
  
  private solveLinearSystem(A: number[][], b: number[]) {
    // Implementação simplificada de eliminação gaussiana
    const n = A.length;
    const augmented = A.map((row, i) => [...row, b[i]]);
    
    // Forward elimination
    for (let i = 0; i < n; i++) {
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = k;
        }
      }
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
      
      for (let k = i + 1; k < n; k++) {
        const factor = augmented[k][i] / augmented[i][i];
        for (let j = i; j <= n; j++) {
          augmented[k][j] -= factor * augmented[i][j];
        }
      }
    }
    
    // Back substitution
    const x = Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      x[i] = augmented[i][n];
      for (let j = i + 1; j < n; j++) {
        x[i] -= augmented[i][j] * x[j];
      }
      x[i] /= augmented[i][i];
    }
    
    return x;
  }
  
  private calculateRSquared(actual: number[], predicted: number[]) {
    const actualMean = actual.reduce((sum, val) => sum + val, 0) / actual.length;
    
    const totalSumSquares = actual.reduce((sum, val) => sum + Math.pow(val - actualMean, 2), 0);
    const residualSumSquares = actual.reduce((sum, val, i) => 
      sum + Math.pow(val - predicted[i], 2), 0);
    
    return 1 - (residualSumSquares / totalSumSquares);
  }
  
  private analyzeCorrelations(data: any[]) {
    // Analisar correlações entre diferentes fatores
    const correlations: Record<string, number> = {};
    
    // Correlação entre quantidade original e otimizada
    const originalQtds = data.map((item: any) => item.qtd);
    const optimizedQtds = data.map((item: any) => item.qtd_otimizada);
    correlations.qtdCorrelation = this.calculateCorrelation(originalQtds, optimizedQtds);
    
    return correlations;
  }
  
  private calculateCorrelation(x: number[], y: number[]) {
    const n = x.length;
    const xMean = x.reduce((sum, val) => sum + val, 0) / n;
    const yMean = y.reduce((sum, val) => sum + val, 0) / n;
    
    let numerator = 0;
    let xVariance = 0;
    let yVariance = 0;
    
    for (let i = 0; i < n; i++) {
      const xDiff = x[i] - xMean;
      const yDiff = y[i] - yMean;
      numerator += xDiff * yDiff;
      xVariance += xDiff * xDiff;
      yVariance += yDiff * yDiff;
    }
    
    return numerator / Math.sqrt(xVariance * yVariance);
  }

  private calculateVariance(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / (values.length - 1); // Sample variance
  }
  
  private analyzeTemporalPatterns(data: any[]) {
    // Por enquanto, retornar null pois não temos timestamps nos dados
    // Em futuras versões, analisar padrões temporais se houver dados de data
    return null;
  }

  async getTrainingHistory(): Promise<TrainingHistoryEntry[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false });

      if (error) throw error;

      return data.map(session => ({
        id: session.id,
        data_inicio: session.start_time,
        data_fim: session.end_time,
        status: session.status,
        exemplos_processados: session.examples_processed || 0,
        mensagem_erro: session.error_message
      }));
    } catch (error) {
      console.error('Erro ao obter histórico de treinamento:', error);
      throw error;
    }
  }

  async getOptimizationLogs(): Promise<OptimizationLog[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('optimization_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      return data.map(log => ({
        id: log.id,
        data_hora: log.timestamp,
        tolerancia: log.tolerance,
        linhas_processadas: log.lines_processed,
        resumo: log.summary
      }));
    } catch (error) {
      console.error('Erro ao obter logs de otimização:', error);
      throw error;
    }
  }

  async signup(email: string, password: string) {
    try {
      // Criar usuário
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('Erro no signup:', error);
        return { 
          data: null, 
          error: {
            message: error.message || 'Erro ao criar conta',
            status: error.status
          }
        };
      }

      // Para contas criadas com sucesso, fazer login automático
      if (data.user) {
        // Fazer login automático após criação
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (loginError) {
          console.error('Erro no login automático:', loginError);
          return { 
            data: null, 
            error: {
              message: loginError.message || 'Conta criada mas erro ao fazer login',
              status: loginError.status
            }
          };
        }

        return { data: loginData, error: null };
      }

      return { data, error: null };
    } catch (err: any) {
      console.error('Erro inesperado no signup:', err);
      return { 
        data: null, 
        error: {
          message: 'Erro ao conectar com o servidor',
          status: 500
        }
      };
    }
  }

  async login(email: string, password: string) {
    try {
      // Fazer login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Erro no login:', error);
        // Retornar erro formatado
        return { 
          data: null, 
          error: {
            message: error.message || 'Erro ao fazer login',
            status: error.status
          }
        };
      }

      return { data, error: null };
    } catch (err: any) {
      console.error('Erro inesperado no login:', err);
      return { 
        data: null, 
        error: {
          message: 'Erro ao conectar com o servidor',
          status: 500
        }
      };
    }
  }

  async logout() {
    return await supabase.auth.signOut();
  }

  async getCurrentUser() {
    return await supabase.auth.getUser();
  }

  async getSession() {
    return await supabase.auth.getSession();
  }

  // Função para verificar se o usuário está autenticado
  async isAuthenticated() {
    try {
      // Primeiro tentar obter a sessão (mais confiável)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        return true;
      }
      
      // Se não houver sessão, verificar usuário
      const { data: { user } } = await supabase.auth.getUser();
      return !!user;
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      return false;
    }
  }

  async deleteTraining(trainingId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Não excluir dados de treinamento e modelos, apenas a sessão
      // para evitar a exclusão de dados de outros treinamentos.

      // Excluir sessão de treinamento
      const { error: sessionError } = await supabase
        .from('training_sessions')
        .delete()
        .eq('id', trainingId)
        .eq('user_id', user.id);

      if (sessionError) {
        console.error('Erro ao excluir sessão:', sessionError);
        throw new Error('Erro ao excluir treinamento: ' + sessionError.message);
      }

      console.log('Treinamento excluído com sucesso:', trainingId);
    } catch (error) {
      console.error('Erro ao excluir treinamento:', error);
      throw error;
    }
  }

  async deleteOptimization(optimizationId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Excluir log de otimização
      const { error } = await supabase
        .from('optimization_logs')
        .delete()
        .eq('id', optimizationId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao excluir otimização:', error);
        throw new Error('Erro ao excluir otimização: ' + error.message);
      }

      console.log('Otimização excluída com sucesso:', optimizationId);
    } catch (error) {
      console.error('Erro ao excluir otimização:', error);
      throw error;
    }
  }
}

export const realApiService = new RealApiService();
