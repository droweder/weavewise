export interface ProductionItem {
  id: string;
  referencia: string;
  cor: string;
  tamanho: string;
  qtd: number;
  qtd_otimizada?: number;
  diferenca?: number;
  editavel?: boolean;
}

export interface OptimizationResult {
  success: boolean;
  items: ProductionItem[];
  summary: {
    total_items: number;
    increases: number;
    decreases: number;
    unchanged: number;
  };
}

export interface TrainingHistoryEntry {
  id: string;
  data_inicio: string;
  data_fim: string | null;
  status: string;
  exemplos_processados: number;
  mensagem_erro?: string;
}

export interface OptimizationLog {
  id: string;
  data_hora: string;
  tolerancia: number;
  linhas_processadas: number;
  resumo: {
    aumentos: number;
    diminuicoes: number;
    inalterados: number;
  };
}
