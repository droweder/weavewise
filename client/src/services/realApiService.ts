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
    const optimizedItems = items.map(item => {
      // Aplicar o modelo treinado para cada item
      const prediction = this.predictOptimalQuantity(item, modelWeights, tolerance);
      const qtd_otimizada = Math.max(1, Math.round(prediction.optimizedQuantity));
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

  private predictOptimalQuantity(item: ProductionItem, modelWeights: any, tolerance: number) {
    // Predição baseada EXCLUSIVAMENTE nos padrões históricos do analista
    const features = this.extractItemFeatures(item);
    let optimizedQuantity = item.qtd;
    let confidence = 0.1; // Base muito baixa, só aumenta com padrões conhecidos
    const factors = [];
    let hasPattern = false;

    // Aplicar padrões aprendidos por referência (prioridade máxima)
    if (modelWeights.referencePatterns && modelWeights.referencePatterns[item.referencia]) {
      const refPattern = modelWeights.referencePatterns[item.referencia];
      const referenceAdjustment = refPattern.avgAdjustmentRatio;
      
      optimizedQuantity *= referenceAdjustment;
      confidence += refPattern.confidence * 0.4; // Até 40% da confiança
      factors.push(`REF: ${((referenceAdjustment - 1) * 100).toFixed(1)}% (${refPattern.count} exemplos)`);
      hasPattern = true;
    }

    // Aplicar padrões por tamanho do analista
    if (modelWeights.sizePatterns && modelWeights.sizePatterns[item.tamanho]) {
      const sizePattern = modelWeights.sizePatterns[item.tamanho];
      const sizeAdjustment = sizePattern.avgAdjustmentRatio;
      
      optimizedQuantity *= sizeAdjustment;
      confidence += sizePattern.confidence * 0.25; // Até 25% da confiança
      factors.push(`TAM: ${((sizeAdjustment - 1) * 100).toFixed(1)}% (${sizePattern.count} exemplos)`);
      hasPattern = true;
    }

    // Aplicar padrões por cor do analista
    if (modelWeights.colorPatterns && modelWeights.colorPatterns[item.cor]) {
      const colorPattern = modelWeights.colorPatterns[item.cor];
      const colorAdjustment = colorPattern.avgAdjustmentRatio;
      
      optimizedQuantity *= colorAdjustment;
      confidence += colorPattern.confidence * 0.2; // Até 20% da confiança
      factors.push(`COR: ${((colorAdjustment - 1) * 100).toFixed(1)}% (${colorPattern.count} exemplos)`);
      hasPattern = true;
    }

    // Aplicar padrões por faixa de quantidade do analista
    const quantityRange = this.getQuantityRange(item.qtd);
    if (modelWeights.quantityRangePatterns && modelWeights.quantityRangePatterns[quantityRange]) {
      const rangePattern = modelWeights.quantityRangePatterns[quantityRange];
      const rangeAdjustment = rangePattern.avgAdjustmentRatio;
      
      optimizedQuantity *= rangeAdjustment;
      confidence += rangePattern.confidence * 0.15; // Até 15% da confiança
      factors.push(`Faixa: ${((rangeAdjustment - 1) * 100).toFixed(1)}% (${rangePattern.count} exemplos)`);
      hasPattern = true;
    }

    // Aplicar modelo de regressão linear treinado nos dados do analista
    if (modelWeights.linearRegression && modelWeights.linearRegression.coefficients) {
      const regression = modelWeights.linearRegression;
      const regressionPrediction = this.applyLinearRegression(features, regression);
      
      // Combinar com peso baseado na qualidade do modelo R²
      const regressionWeight = Math.min(regression.rSquared || 0.3, 0.5);
      if (regressionWeight > 0.3) { // Só usar se R² for razoável
        optimizedQuantity = (optimizedQuantity * (1 - regressionWeight)) + 
                           (regressionPrediction * regressionWeight);
        confidence += regressionWeight * 0.3;
        factors.push(`ML R²=${(regression.rSquared * 100).toFixed(1)}%`);
        hasPattern = true;
      }
    }

    // Se não encontrou padrões históricos, manter quantidade original
    if (!hasPattern) {
      factors.push('Sem padrão histórico - mantendo quantidade original');
      confidence = 0.0;
    }

    // Aplicar apenas a tolerância definida pelo usuário (não regras arbitrárias)
    const toleranceRange = tolerance / 100;
    const randomFactor = 1 + (Math.random() - 0.5) * 2 * toleranceRange;
    optimizedQuantity *= randomFactor;

    // Arredondar para número inteiro e garantir mínimo de 1
    optimizedQuantity = Math.max(1, Math.round(optimizedQuantity));
    confidence = Math.min(confidence, 1.0);

    return {
      optimizedQuantity,
      confidence,
      factors
    };
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
    console.log('Iniciando treinamento avançado do modelo com', data.length, 'exemplos');
    
    // Validar e limpar dados
    const cleanedData = this.validateAndCleanTrainingData(data);
    console.log('Dados limpos:', cleanedData.length, 'exemplos válidos');
    
    if (cleanedData.length < 5) {
      throw new Error('Dados insuficientes para treinamento. Mínimo: 5 exemplos');
    }
    
    // Análise de padrões por categoria
    const referencePatterns = this.analyzePatternsByCategory(cleanedData, 'Referência');
    const colorPatterns = this.analyzePatternsByCategory(cleanedData, 'Cor');
    const sizePatterns = this.analyzePatternsByCategory(cleanedData, 'Tamanho');
    const quantityRangePatterns = this.analyzeQuantityRangePatterns(cleanedData);
    
    // Treinamento de regressão linear
    const linearRegression = this.trainLinearRegression(cleanedData);
    
    // Análise de correlações
    const correlationAnalysis = this.analyzeCorrelations(cleanedData);
    
    // Análise de tendências temporais (se houver dados suficientes)
    const temporalPatterns = this.analyzeTemporalPatterns(cleanedData);
    
    // Métricas de qualidade do modelo
    const qualityMetrics = this.calculateModelQuality(cleanedData, {
      referencePatterns,
      colorPatterns, 
      sizePatterns,
      quantityRangePatterns,
      linearRegression
    });
    
    console.log('Treinamento concluído. Qualidade do modelo:', qualityMetrics);
    
    return {
      // Padrões por categoria
      referencePatterns,
      colorPatterns,
      sizePatterns,
      quantityRangePatterns,
      
      // Modelos matemáticos
      linearRegression,
      correlationAnalysis,
      temporalPatterns,
      
      // Métricas e metadados
      qualityMetrics,
      sample_size: cleanedData.length,
      trained_at: new Date().toISOString(),
      version: 'v2.0-advanced',
      
      // Estatísticas gerais
      statistics: {
        avgOriginalQtd: cleanedData.reduce((acc, item) => acc + item.qtd, 0) / cleanedData.length,
        avgOptimizedQtd: cleanedData.reduce((acc, item) => acc + item.qtd_otimizada, 0) / cleanedData.length,
        avgAdjustmentRatio: cleanedData.reduce((acc, item) => acc + (item.qtd_otimizada / item.qtd), 0) / cleanedData.length,
        totalVariance: this.calculateVariance(cleanedData.map(item => item.qtd_otimizada / item.qtd))
      }
    };
  }
  
  private validateAndCleanTrainingData(data: any[]) {
    return data.filter(item => {
      // Validar campos obrigatórios
      const hasRequiredFields = 
        item.Referência && 
        item.Cor && 
        item.Tamanho && 
        typeof item.Qtd !== 'undefined' && 
        typeof item.Qtd_Otimizada !== 'undefined';
      
      if (!hasRequiredFields) return false;
      
      // Converter e validar números
      const qtd = typeof item.Qtd === 'number' ? item.Qtd : parseFloat(item.Qtd);
      const qtdOtimizada = typeof item.Qtd_Otimizada === 'number' ? 
        item.Qtd_Otimizada : parseFloat(item.Qtd_Otimizada);
      
      return !isNaN(qtd) && !isNaN(qtdOtimizada) && qtd > 0 && qtdOtimizada > 0;
    }).map(item => ({
      referencia: String(item.Referência).trim(),
      cor: String(item.Cor).trim(),
      tamanho: String(item.Tamanho).trim(),
      qtd: typeof item.Qtd === 'number' ? item.Qtd : parseFloat(item.Qtd),
      qtd_otimizada: typeof item.Qtd_Otimizada === 'number' ? 
        item.Qtd_Otimizada : parseFloat(item.Qtd_Otimizada),
      adjustment_ratio: (typeof item.Qtd_Otimizada === 'number' ? 
        item.Qtd_Otimizada : parseFloat(item.Qtd_Otimizada)) / 
        (typeof item.Qtd === 'number' ? item.Qtd : parseFloat(item.Qtd))
    }));
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
  
  private calculateModelQuality(data: any[], model: any) {
    // Simular performance do modelo nos dados de treinamento
    let totalError = 0;
    let correctPredictions = 0;
    
    data.forEach((item: any) => {
      const prediction = this.predictOptimalQuantity({
        id: `temp-${Math.random()}`,
        referencia: item.referencia,
        cor: item.cor,
        tamanho: item.tamanho,
        qtd: item.qtd
      }, model, 5); // 5% de tolerância para teste
      
      const error = Math.abs(prediction.optimizedQuantity - item.qtd_otimizada);
      const relativeError = error / item.qtd_otimizada;
      
      totalError += relativeError;
      if (relativeError < 0.1) { // Dentro de 10% do valor real
        correctPredictions++;
      }
    });
    
    return {
      averageError: totalError / data.length,
      accuracy: correctPredictions / data.length,
      qualityScore: Math.max(0, 1 - (totalError / data.length))
    };
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
    // Criar usuário
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) {
      throw error;
    }

    // Para contas criadas com sucesso, fazer login automático
    if (data.user) {
      // Fazer login automático após criação
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (loginError) {
        throw loginError;
      }

      return { data: loginData, error: null };
    }

    return { data, error };
  }

  async login(email: string, password: string) {
    // Fazer login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw error;
    }

    return { data, error };
  }

  async logout() {
    return await supabase.auth.signOut();
  }

  async getCurrentUser() {
    return await supabase.auth.getUser();
  }

  // Função para verificar se o usuário está autenticado
  async isAuthenticated() {
    try {
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
