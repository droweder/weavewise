export interface ValidationResponse {
  valid: boolean;
  errors: string[];
}

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

// Função para validar os dados do Excel
export const validateExcelData = (data: any[][]): ValidationResponse => {
  const errors: string[] = [];
  
  // Verificar se há dados
  if (!data || data.length === 0) {
    errors.push('Nenhum dado encontrado na planilha');
    return { valid: false, errors };
  }
  
  // Verificar se a primeira linha contém os cabeçalhos esperados
  const headers = data[0];
  const requiredHeaders = ['Referência', 'Cor', 'Tamanho', 'Qtd'];
  const missingHeaders = requiredHeaders.filter(header => 
    !headers.includes(header)
  );
  
  if (missingHeaders.length > 0) {
    errors.push(`Cabeçalhos obrigatórios faltando: ${missingHeaders.join(', ')}`);
  }
  
  // Verificar se há pelo menos uma linha de dados
  if (data.length < 2) {
    errors.push('Nenhuma linha de dados encontrada');
  }
  
  // Validar cada linha de dados
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    // Verificar se a linha tem o número correto de colunas
    if (row.length < 4) {
      errors.push(`Linha ${i + 1}: Número incorreto de colunas`);
      continue;
    }
    
    // Validar campos obrigatórios
    const [referencia, cor, tamanho, qtd] = row;
    
    if (!referencia || referencia.toString().trim() === '') {
      errors.push(`Linha ${i + 1}: Referência é obrigatória`);
    }
    
    if (!cor || cor.toString().trim() === '') {
      errors.push(`Linha ${i + 1}: Cor é obrigatória`);
    }
    
    if (!tamanho || tamanho.toString().trim() === '') {
      errors.push(`Linha ${i + 1}: Tamanho é obrigatório`);
    }
    
    // Validar quantidade como número
    const qtdNum = Number(qtd);
    if (isNaN(qtdNum) || qtdNum <= 0) {
      errors.push(`Linha ${i + 1}: Quantidade inválida`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Função para converter dados do Excel em ProductionItem
export const parseExcelToProductionItems = (data: any[][]): ProductionItem[] => {
  if (data.length < 2) return [];
  
  const items: ProductionItem[] = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const [referencia, cor, tamanho, qtd] = row;
    
    // Verificar se a linha tem dados válidos
    if (!referencia || !cor || !tamanho || isNaN(Number(qtd))) {
      continue;
    }
    
    items.push({
      id: `${referencia}-${cor}-${tamanho}-${i}`,
      referencia: referencia.toString(),
      cor: cor.toString(),
      tamanho: tamanho.toString(),
      qtd: Number(qtd)
    });
  }
  
  return items;
};
