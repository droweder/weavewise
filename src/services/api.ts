import { OptimizationResult, TrainingHistoryEntry, OptimizationLog, ProductionItem } from '../types';

// Mock API service - replace with actual backend integration
class ApiService {
  private baseUrl = '/api';

  async optimizeProduction(items: ProductionItem[], tolerance: number): Promise<OptimizationResult> {
    // Simulate API call
    await this.delay(2000);
    
    const optimizedItems = items.map(item => {
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

  async trainModel(file: File): Promise<{ success: boolean; message: string }> {
    // Simulate Python module execution
    await this.delay(3000);
    
    return {
      success: Math.random() > 0.2, // 80% success rate for demo
      message: Math.random() > 0.2 ? 'Modelo treinado com sucesso' : 'Erro ao processar arquivo de treinamento'
    };
  }

  async getTrainingHistory(): Promise<TrainingHistoryEntry[]> {
    await this.delay(500);
    
    return [
      {
        id: '1',
        data_inicio: '2024-01-15T08:00:00Z',
        data_fim: '2024-01-15T08:05:00Z',
        status: 'Sucesso',
        exemplos_processados: 1250
      },
      {
        id: '2',
        data_inicio: '2024-01-10T14:30:00Z',
        data_fim: '2024-01-10T14:35:00Z',
        status: 'Sucesso',
        exemplos_processados: 980
      },
      {
        id: '3',
        data_inicio: '2024-01-08T10:15:00Z',
        data_fim: '2024-01-08T10:16:00Z',
        status: 'Falha',
        exemplos_processados: 0,
        mensagem_erro: 'Colunas obrigatórias não encontradas'
      }
    ];
  }

  async getOptimizationLogs(): Promise<OptimizationLog[]> {
    await this.delay(500);
    
    return [
      {
        id: '1',
        data_hora: '2024-01-15T10:30:00Z',
        tolerancia: 5,
        linhas_processadas: 120,
        resumo: { aumentos: 45, diminuicoes: 38, inalterados: 37 }
      },
      {
        id: '2',
        data_hora: '2024-01-14T16:20:00Z',
        tolerancia: 8,
        linhas_processadas: 89,
        resumo: { aumentos: 32, diminuicoes: 28, inalterados: 29 }
      }
    ];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const apiService = new ApiService();