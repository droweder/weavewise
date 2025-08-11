import React, { useState, useEffect } from 'react';
import { realApiService } from '../services/realApiService';
import { Database, Download, Filter } from 'lucide-react';

export const TrainingDataViewer: React.FC = () => {
  const [trainingData, setTrainingData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  // Função auxiliar para calcular MDC (Máximo Divisor Comum)
  const gcd = (a: number, b: number): number => {
    return b === 0 ? a : gcd(b, a % b);
  };

  // Função para calcular MDC de múltiplos números
  const gcdMultiple = (numbers: number[]): number => {
    if (numbers.length === 0) return 1;
    if (numbers.length === 1) return numbers[0];
    
    let result = numbers[0];
    for (let i = 1; i < numbers.length; i++) {
      result = gcd(result, numbers[i]);
    }
    return result;
  };



  // Função para ordenar cabeçalhos na ordem desejada: Referência, Tamanho, Cor, Quantidade...
  const getOrderedHeaders = (item: any) => {
    const allHeaders = Object.keys(item);
    
    // Lista de possíveis nomes de campos na ordem desejada
    const orderedHeadersOptions = [
      ['referencia', 'Referência', 'REFERENCIA'],
      ['tamanho', 'Tamanho', 'TAMANHO'], 
      ['cor', 'Cor', 'COR'],
      ['qtd', 'Qtd', 'QTD', 'Quantidade'],
      ['qtd_otimizada', 'Qtd_otimizada', 'QTD_OTIMIZADA', 'qtd otimizada']
    ];
    
    const result: string[] = [];
    
    // Para cada grupo de opções, encontrar qual campo existe nos dados
    orderedHeadersOptions.forEach(options => {
      const foundHeader = options.find(option => allHeaders.includes(option));
      if (foundHeader) {
        result.push(foundHeader);
      }
    });
    
    // Adicionar colunas calculadas
    result.push('camadas', 'repeticoes');
    
    // Adicionar outros cabeçalhos que não estão na lista ordenada
    const usedHeaders = new Set([...result, ...orderedHeadersOptions.flat()]);
    const remainingHeaders = allHeaders.filter(header => !usedHeaders.has(header));
    
    return [...result, ...remainingHeaders];
  };

  // Função para converter nomes de campos para português
  const getDisplayName = (fieldName: string) => {
    const fieldMap: Record<string, string> = {
      'referencia': 'REFERÊNCIA',
      'Referência': 'REFERÊNCIA', 
      'REFERENCIA': 'REFERÊNCIA',
      'tamanho': 'TAMANHO',
      'Tamanho': 'TAMANHO',
      'TAMANHO': 'TAMANHO',
      'cor': 'COR',
      'Cor': 'COR', 
      'COR': 'COR',
      'qtd': 'QTD',
      'Qtd': 'QTD',
      'QTD': 'QTD',
      'Quantidade': 'QTD',
      'qtd_otimizada': 'QTD_OTIMIZADA',
      'Qtd_otimizada': 'QTD_OTIMIZADA',
      'QTD_OTIMIZADA': 'QTD_OTIMIZADA',
      'qtd otimizada': 'QTD_OTIMIZADA',
      'camadas': 'CAMADAS',
      'repeticoes': 'REPETIÇÕES'
    };
    return fieldMap[fieldName] || fieldName.toUpperCase();
  };

  // Função para detectar camadas usando MDC por referência+cor
  const detectLayersForRefCor = (data: any[], referencia: string, cor: string): number => {
    // Filtrar itens da mesma referência+cor
    const sameRefCorItems = data.filter(item => {
      const itemRef = String(item.referencia || item.Referência || item.REFERENCIA || '');
      const itemCor = String(item.cor || item.Cor || item.COR || '');
      return itemRef === String(referencia) && itemCor === String(cor);
    });
    
    if (sameRefCorItems.length === 0) return 36;
    
    // Coletar quantidades OTIMIZADAS preferencialmente (usa QTD só se não tiver QTD_OTIMIZADA)
    const quantities = sameRefCorItems
      .map(item => {
        const qtdOtimizada = parseInt(item.qtd_otimizada || item.Qtd_otimizada || item.QTD_OTIMIZADA || item['Qtd_Otimizada']) || 0;
        const qtdOriginal = parseInt(item.qtd || item.Qtd || item.QTD) || 0;
        // Sempre usar QTD_OTIMIZADA se existir, senão usar QTD
        return qtdOtimizada > 0 ? qtdOtimizada : qtdOriginal;
      })
      .filter(qtd => qtd > 0);
    
    if (quantities.length === 0) return 36;
    
    // Calcular MDC de todas as quantidades do grupo
    const mdc = gcdMultiple(quantities);
    

    
    // O MDC é o número correto de camadas
    // Só validar se está dentro de um range razoável (6 a 60 camadas)
    if (mdc >= 6 && mdc <= 60) {
      return mdc;
    }
    
    // Se MDC estiver fora do range, usar valor padrão
    return 36;
  };

  // Função para obter valor de uma célula (incluindo cálculos)
  const getCellValue = (item: any, header: string) => {
    if (header === 'camadas') {
      const referencia = String(item.referencia || item.Referência || item.REFERENCIA || '');
      const cor = String(item.cor || item.Cor || item.COR || '');
      return detectLayersForRefCor(trainingData, referencia, cor);
    }
    
    if (header === 'repeticoes') {
      const qtdOtimizada = parseInt(item.qtd_otimizada || item.Qtd_otimizada || item.QTD_OTIMIZADA || item.qtd || 0);
      const referencia = item.referencia || item.Referência || item.REFERENCIA || '';
      const cor = item.cor || item.Cor || item.COR || '';
      const camadas = detectLayersForRefCor(trainingData, referencia, cor);
      
      return camadas > 0 ? Math.round(qtdOtimizada / camadas) : 1;
    }
    
    return item[header] || '';
  };

  useEffect(() => {
    const fetchTrainingData = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await realApiService.getCurrentUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data, error } = await realApiService.supabase
          .from('training_data')
          .select('data')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Extrair dados de todos os registros
        const allData = data.flatMap(record => record.data);
        
        // Debug: verificar se 60797 está nos dados
        const has60797 = allData.some(item => {
          const ref = String(item.referencia || item.Referência || item.REFERENCIA || '');
          return ref === '60797';
        });
        console.log('Dados carregados. Total:', allData.length, 'Tem 60797?', has60797);
        if (has60797) {
          const items60797 = allData.filter(item => {
            const ref = String(item.referencia || item.Referência || item.REFERENCIA || '');
            return ref === '60797';
          });
          console.log('Itens da 60797:', items60797);
        }
        
        setTrainingData(allData);
      } catch (err) {
        setError('Erro ao carregar dados de treinamento');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrainingData();
  }, []);

  const filteredData = trainingData.filter(item => {
    if (!filter) return true;
    return Object.values(item).some(val => 
      String(val).toLowerCase().includes(filter.toLowerCase())
    );
  });

  const exportData = () => {
    if (trainingData.length === 0) return;

    // Converter para formato CSV
    const headers = getOrderedHeaders(trainingData[0]);
    const displayHeaders = headers.map(header => getDisplayName(header));
    const csvContent = [
      displayHeaders.join(','),
      ...trainingData.map(item => 
        headers.map(header => 
          `"${String(getCellValue(item, header)).replace(/"/g, '""')}"`
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `dados_treinamento_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Dados de Treinamento</h2>
        <div className="flex space-x-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Filtrar dados..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={exportData}
            disabled={trainingData.length === 0}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </button>
        </div>
      </div>

      {trainingData.length === 0 ? (
        <div className="text-center py-12">
          <Database className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum dado de treinamento</h3>
          <p className="mt-1 text-sm text-gray-500">
            Os dados de treinamento aparecerão aqui após você treinar modelos.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {getOrderedHeaders(trainingData[0]).map((header) => (
                  <th 
                    key={header} 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {getDisplayName(header)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.slice(0, 100).map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  {getOrderedHeaders(item).map((header, i) => (
                    <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={header === 'camadas' || header === 'repeticoes' ? 'font-semibold text-blue-600' : ''}>
                        {String(getCellValue(item, header))}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredData.length > 100 && (
            <div className="mt-4 text-sm text-gray-500">
              Mostrando 100 de {filteredData.length} registros. Use o filtro para ver mais dados específicos.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
