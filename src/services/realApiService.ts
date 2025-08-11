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
    // Esta é uma implementação simplificada
    // Em um cenário real, você aplicaria os pesos do modelo para prever otimizações
    const optimizedItems = items.map(item => {
      // Simular aplicação do modelo
      const baseVariation = modelWeights.base_factor || 0.05;
      const variation = (Math.random() - 0.5) * 2 * (tolerance / 100) + baseVariation;
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
    // Esta é uma implementação simplificada de treinamento
    // Em um cenário real, você implementaria algoritmos mais complexos
    
    // Extrair características dos dados
    const quantities = data.map(item => 
      typeof item.Qtd === 'number' ? item.Qtd : parseFloat(item.Qtd)
    ).filter(q => !isNaN(q));
    
    // Calcular estatísticas básicas
    const mean = quantities.reduce((a, b) => a + b, 0) / quantities.length;
    const variance = quantities.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / quantities.length;
    
    // Criar pesos do modelo simplificado
    return {
      base_factor: mean / 1000, // Fator base baseado na média
      variance_factor: variance / 10000, // Fator de variação
      sample_size: quantities.length, // Tamanho da amostra
      trained_at: new Date().toISOString() // Data do treinamento
    };
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
      console.warn('Auth check failed:', error);
      return false;
    }
  }

  // Função para verificar se o Supabase está configurado
  isSupabaseConfigured() {
    return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
  }
}

export const realApiService = new RealApiService();
