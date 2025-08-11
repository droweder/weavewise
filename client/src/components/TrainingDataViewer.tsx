import React, { useState, useEffect } from 'react';
import { realApiService } from '../services/realApiService';
import { Database, Download, Filter } from 'lucide-react';

export const TrainingDataViewer: React.FC = () => {
  const [trainingData, setTrainingData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  // Função para ordenar cabeçalhos na ordem desejada: Referência, Tamanho, Cor, Quantidade...
  const getOrderedHeaders = (item: any) => {
    const allHeaders = Object.keys(item);
    const orderedHeaders = ['referencia', 'tamanho', 'cor', 'qtd', 'qtd_otimizada'];
    
    // Primeiro, adicionar os cabeçalhos na ordem desejada (se existirem)
    const result = orderedHeaders.filter(header => allHeaders.includes(header));
    
    // Depois, adicionar outros cabeçalhos que não estão na lista ordenada
    const remainingHeaders = allHeaders.filter(header => !orderedHeaders.includes(header));
    
    return [...result, ...remainingHeaders];
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
      val.toString().toLowerCase().includes(filter.toLowerCase())
    );
  });

  const exportData = () => {
    if (trainingData.length === 0) return;

    // Converter para formato CSV
    const headers = getOrderedHeaders(trainingData[0]);
    const csvContent = [
      headers.join(','),
      ...trainingData.map(item => 
        headers.map(header => 
          `"${String(item[header]).replace(/"/g, '""')}"`
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
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.slice(0, 100).map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  {getOrderedHeaders(item).map((header, i) => (
                    <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {String(item[header])}
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
