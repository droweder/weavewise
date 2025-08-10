import { ExcelValidationResult, ProductionItem } from '../types';

export const REQUIRED_COLUMNS = ['Referência', 'Cor', 'Tamanho', 'Qtd'];
export const TRAINING_REQUIRED_COLUMNS = ['Referência', 'Cor', 'Tamanho', 'Qtd', 'Qtd_Otimizada'];

export const validateExcelData = (data: any[][], isTraining = false): ExcelValidationResult => {
  const requiredColumns = isTraining ? TRAINING_REQUIRED_COLUMNS : REQUIRED_COLUMNS;
  const errors: string[] = [];
  
  if (!data || data.length === 0) {
    return {
      valid: false,
      errors: ['Planilha vazia ou não encontrada'],
      hasDataSheet: false,
      missingColumns: requiredColumns
    };
  }

  const headers = data[0];
  if (!headers) {
    return {
      valid: false,
      errors: ['Cabeçalho não encontrado'],
      hasDataSheet: false,
      missingColumns: requiredColumns
    };
  }

  const normalizedHeaders = headers.map((h: string) => h?.toString().trim().toLowerCase());
  const missingColumns = requiredColumns.filter(col => 
    !normalizedHeaders.includes(col.toLowerCase())
  );

  if (missingColumns.length > 0) {
    errors.push(`Colunas obrigatórias não encontradas: ${missingColumns.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    hasDataSheet: true,
    missingColumns
  };
};

export const parseExcelToProductionItems = (data: any[][]): ProductionItem[] => {
  if (!data || data.length < 2) return [];

  const headers = data[0].map((h: string) => h?.toString().trim().toLowerCase());
  const items: ProductionItem[] = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    const item: ProductionItem = {
      id: `${i}`,
      referencia: '',
      cor: '',
      tamanho: '',
      qtd: 0
    };

    headers.forEach((header, index) => {
      const value = row[index]?.toString().trim();
      if (!value) return;

      switch (header) {
        case 'referência':
          item.referencia = value;
          break;
        case 'cor':
          item.cor = value;
          break;
        case 'tamanho':
          item.tamanho = value;
          break;
        case 'qtd':
          item.qtd = parseInt(value) || 0;
          break;
        case 'qtd_otimizada':
          item.qtd_otimizada = parseInt(value) || 0;
          break;
      }
    });

    if (item.referencia && item.cor && item.tamanho && item.qtd > 0) {
      items.push(item);
    }
  }

  return items;
};