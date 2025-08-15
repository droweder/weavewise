import { supabase } from '../utils/supabaseClient';
import { ProductionItem, TrainingHistoryEntry, OptimizationLog } from '../types';
import * as XLSX from 'xlsx';

// Serviço real de API com integração com Supabase
class RealApiService {
  // Tornar o supabase acessível externamente
  supabase = supabase;

  async optimizeProduction(items: ProductionItem[], tolerance: number): Promise<any> {
    try {
      // Obter o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Obter o modelo ativo do usuário
      const { data: modelData, error: modelError } = await supabase
        .from('model_weights')
        .select('weights')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (modelError || !modelData) {
        // Se não houver modelo, usar otimização básica
        return this.basicOptimization(items, tolerance);
      }

      // Aplicar otimização baseada no modelo
      const optimizedItems = this.modelBasedOptimization(items, tolerance, modelData.weights);
      
      // Registrar log de otimização
      await this.logOptimization(user.id, tolerance, items.length, optimizedItems);
      
      return optimizedItems;
    } catch (error) {
      console.error('Erro na otimização:', error);
      throw error;
    }
  }

  private basicOptimization(items: ProductionItem[], tolerance: number) {
    const optimizedItems = items.map(item => {
      // Simular variação baseada em padrões históricos
      const variation = (Math.random() - 0.5) * 2 * (tolerance / 100);
      const qtd_otimizada = Math.max(1, Math.round(item.qtd * (1 + variation)));
      const diferenca = qtd_otimizada - item.qtd;
      
      return {
        ...item,
        qtd_otimizada,
        diferenca,
        editavel: true
      };
    });

    const summary = {
      total_items: optimizedItems.length,
      increases: optimizedItems.filter(item => (item.diferenca || 0) > 0).length,
      decreases: optimizedItems.filter(item => (item.diferenca || 0) < 0).length,
      unchanged: optimizedItems.filter(item => (item.diferenca || 0) === 0).length
    };

    return {
      success: true,
      items: optimizedItems,
      summary
    };
  }

  private modelBasedOptimization(items: ProductionItem[], tolerance: number, modelWeights: any) {
    // Primeiro, pré-calcular o MDC para cada grupo de Referencia+Cor nos itens de entrada.
    // Isso evita recalcular o MDC para cada item no loop.
    const inputGroupLayers: Record<string, number> = {};
    const groups: Record<string, ProductionItem[]> = {};

    items.forEach(item => {
      const key = `${item.referencia}-${item.cor}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });

    Object.keys(groups).forEach(key => {
      const groupItems = groups[key];
      const quantities = groupItems.map(i => i.qtd);
      inputGroupLayers[key] = this.gcdMultiple(quantities);
    });

    const optimizedItems = items.map(item => {
      // Aplicar o modelo treinado para cada item
      const prediction = this.predictOptimalQuantity(item, modelWeights, tolerance, inputGroupLayers);
      const qtd_otimizada = Math.max(1, prediction.optimizedQuantity);
      const diferenca = qtd_otimizada - item.qtd;
      
      return {
        ...item,
        qtd_otimizada,
        diferenca,
        editavel: true,
        confidence: prediction.confidence,
        factors: prediction.factors
      };
    });

    const summary = {
      total_items: optimizedItems.length,
      increases: optimizedItems.filter(item => (item.diferenca || 0) > 0).length,
      decreases: optimizedItems.filter(item => (item.diferenca || 0) < 0).length,
      unchanged: optimizedItems.filter(item => (item.diferenca || 0) === 0).length,
      avg_confidence: optimizedItems.reduce((acc, item) => acc + (item.confidence || 0), 0) / optimizedItems.length
    };

    return {
      success: true,
      items: optimizedItems,
      summary
    };
  }

  private predictOptimalQuantity(
    item: ProductionItem,
    modelWeights: any,
    tolerance: number,
    inputGroupLayers: Record<string, number>
  ) {
    let optimizedQuantity = item.qtd;
    let confidence = 0.0;
    let factors: string[] = [];
    let layers = 0;

    const groupKey = `${item.referencia}-${item.cor}`;

    // 1. Tentar encontrar camadas aprendidas no modelo treinado
    if (modelWeights.learnedLayers && modelWeights.learnedLayers[groupKey]) {
      layers = modelWeights.learnedLayers[groupKey];
      confidence = 0.9;
      factors.push(`Padrão de ${layers} camadas aprendido do histórico.`);
    }
    // 2. Fallback: usar o MDC do grupo de entrada atual se não houver padrão aprendido
    else if (inputGroupLayers[groupKey] > 1) {
      layers = inputGroupLayers[groupKey];
      confidence = 0.5;
      factors.push(`MDC de ${layers} camadas detectado no grupo de entrada atual.`);
    }
    // 3. Fallback final: usar o padrão global do modelo
    else if (modelWeights.globalDefaultLayer) {
      layers = modelWeights.globalDefaultLayer;
      confidence = 0.2;
      factors.push(`Usando padrão global de ${layers} camadas.`);
    }
    // 4. Se tudo falhar, não otimizar
    else {
      factors.push('Nenhum padrão aplicável encontrado.');
      return { optimizedQuantity: item.qtd, confidence: 0, factors, layers: 0 };
    }

    // Calcular a quantidade otimizada usando a fórmula de teto
    optimizedQuantity = this.adjustToLayers(item.qtd, layers);

    // Aplicar tolerância (opcional, pode ser removido se não for desejado)
    if (tolerance > 0) {
      const toleranceRange = tolerance / 100;
      const variation = Math.round((Math.random() - 0.5) * 2 * toleranceRange * layers);
      optimizedQuantity = Math.max(layers, optimizedQuantity + variation);
      // Reajustar para garantir que ainda é um múltiplo
      optimizedQuantity = Math.round(optimizedQuantity / layers) * layers;
    }
    
    return {
      optimizedQuantity: Math.max(1, optimizedQuantity),
      confidence,
      factors,
      layers
    };
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
    const summary = {
      aumentos: result.summary.increases,
      diminuicoes: result.summary.decreases,
      inalterados: result.summary.unchanged
    };

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
    console.log('Iniciando treinamento do modelo com lógica de MDC com', data.length, 'exemplos');

    // 1. Validar e limpar dados
    const cleanedData = this.validateAndCleanTrainingData(data);
    console.log('Dados limpos:', cleanedData.length, 'exemplos válidos');

    if (cleanedData.length === 0) {
      throw new Error('Nenhum dado válido encontrado para treinamento.');
    }

    // 2. Agrupar dados por Referência e Cor
    const referenceColorGroups: Record<string, any[]> = {};
    cleanedData.forEach((item: any) => {
      const key = `${item.referencia}-${item.cor}`;
      if (!referenceColorGroups[key]) {
        referenceColorGroups[key] = [];
      }
      referenceColorGroups[key].push(item);
    });

    // 3. Aprender o MDC (camadas) para cada grupo
    const learnedLayers: Record<string, number> = {};
    const allLayers: number[] = [];
    Object.keys(referenceColorGroups).forEach(key => {
      const groupItems = referenceColorGroups[key];
      const optimizedQuantities = groupItems.map(item => item.qtd_otimizada);

      if (optimizedQuantities.length > 0) {
        const mdc = this.gcdMultiple(optimizedQuantities);
        // Usar um valor padrão se o MDC for muito baixo (ex: 1)
        learnedLayers[key] = mdc > 1 ? mdc : this.detectLayers(optimizedQuantities[0]);
        allLayers.push(learnedLayers[key]);
      }
    });
    
    console.log('MDCs (camadas) aprendidos por grupo:', learnedLayers);

    // 4. Determinar um fallback global (a camada mais comum)
    const layerFrequencies: Record<number, number> = {};
    allLayers.forEach(layer => {
      layerFrequencies[layer] = (layerFrequencies[layer] || 0) + 1;
    });
    
    const globalDefaultLayer = Object.keys(layerFrequencies).length > 0
      ? parseInt(Object.entries(layerFrequencies).sort((a, b) => b[1] - a[1])[0][0])
      : 36; // Default fallback se nada for aprendido

    console.log('Fallback de camada global determinado:', globalDefaultLayer);

    // 5. Retornar os pesos do modelo simplificado
    return {
      learnedLayers,
      globalDefaultLayer,
      sample_size: cleanedData.length,
      trained_at: new Date().toISOString(),
      version: 'v4.0-mdc-based',
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
        typeof item.qtd !== 'undefined' && 
        typeof item.qtd_otimizada !== 'undefined';
      
      if (!hasRequiredFields) {
        console.log('Item rejeitado por campos faltantes:', item);
        return false;
      }
      
      // Converter e validar números
      const qtd = typeof item.qtd === 'number' ? item.qtd : parseFloat(item.qtd);
      const qtdOtimizada = typeof item.qtd_otimizada === 'number' ? 
        item.qtd_otimizada : parseFloat(item.qtd_otimizada);
      
      const isValid = !isNaN(qtd) && !isNaN(qtdOtimizada) && qtd > 0 && qtdOtimizada > 0;
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
  
  private analyzeTemporalPatterns(data: any[]) {
    // Por enquanto, retornar null pois não temos timestamps nos dados
    // Em futuras versões, analisar padrões temporais se houver dados de data
    return null;
  }
  
  private calculateVariance(values: number[]) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
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

      // Excluir dados de treinamento relacionados
      const { error: trainingDataError } = await supabase
        .from('training_data')
        .delete()
        .eq('user_id', user.id);

      if (trainingDataError) {
        console.error('Erro ao excluir dados de treinamento:', trainingDataError);
      }

      // Excluir modelo treinado do Supabase
      const { error: modelError } = await supabase
        .from('model_weights')
        .delete()
        .eq('user_id', user.id);

      if (modelError) {
        console.error('Erro ao excluir modelo:', modelError);
      }

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
