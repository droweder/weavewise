import React, { useState, useEffect } from 'react';
import { realApiService } from '../services/realApiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';

interface ModelVersion {
  id: string;
  version: string;
  created_at: string;
  is_active: boolean;
  accuracy?: number;
}

export const ModelComparison: React.FC = () => {
  const [models, setModels] = useState<ModelVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await realApiService.getCurrentUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data, error } = await realApiService.supabase
          .from('model_weights')
          .select('id, version, created_at, is_active')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Adicionar métricas simuladas para demonstração
        const modelsWithMetrics = data.map((model, index) => ({
          ...model,
          accuracy: 85 + (index * 2) // Simular precisão decrescente para modelos mais antigos
        }));

        setModels(modelsWithMetrics);
        
        // Selecionar os dois modelos mais recentes por padrão
        if (modelsWithMetrics.length >= 2) {
          setSelectedModels([modelsWithMetrics[0].id, modelsWithMetrics[1].id]);
        } else if (modelsWithMetrics.length === 1) {
          setSelectedModels([modelsWithMetrics[0].id]);
        }
      } catch (err) {
        setError('Erro ao carregar modelos');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  const toggleModelSelection = (modelId: string) => {
    setSelectedModels(prev => 
      prev.includes(modelId) 
        ? prev.filter(id => id !== modelId) 
        : [...prev, modelId]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Dados para o gráfico de comparação
  const chartData = models
    .filter(model => selectedModels.includes(model.id))
    .map(model => ({
      name: model.version,
      Precisão: model.accuracy || 0,
      Ativo: model.is_active ? 100 : 0
    }));

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
      <div className="flex items-center mb-6">
        <TrendingUp className="h-6 w-6 text-blue-600 mr-2" />
        <h2 className="text-xl font-bold text-gray-900">Comparação de Modelos</h2>
      </div>

      {models.length === 0 ? (
        <div className="text-center py-12">
          <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum modelo treinado</h3>
          <p className="mt-1 text-sm text-gray-500">
            Treine seu primeiro modelo para começar a comparar desempenho.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de modelos */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Modelos Treinados</h3>
            <div className="space-y-3">
              {models.map((model) => (
                <div 
                  key={model.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedModels.includes(model.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => toggleModelSelection(model.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center">
                        <h4 className="font-medium text-gray-900">{model.version}</h4>
                        {model.is_active && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Ativo
                          </span>
                        )}
                      </div>
                      <div className="flex items-center mt-1 text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(model.created_at)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {model.accuracy?.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">Precisão</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gráfico de comparação */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Comparação de Desempenho</h3>
            {selectedModels.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 50,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Precisão']}
                      labelFormatter={(value) => `Modelo: ${value}`}
                    />
                    <Legend />
                    <Bar dataKey="Precisão" fill="#3b82f6" name="Precisão (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
                <p className="text-gray-500">Selecione modelos para comparar</p>
              </div>
            )}
            
            {selectedModels.length > 0 && (
              <div className="mt-6">
                <h4 className="text-md font-medium text-gray-900 mb-2">Resumo da Comparação</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-800">Melhor Precisão</p>
                    <p className="text-xl font-bold text-blue-900">
                      {Math.max(...chartData.map(d => d.Precisão)).toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-green-800">Média de Precisão</p>
                    <p className="text-xl font-bold text-green-900">
                      {(chartData.reduce((sum, d) => sum + d.Precisão, 0) / chartData.length).toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-purple-800">Modelos Selecionados</p>
                    <p className="text-xl font-bold text-purple-900">{selectedModels.length}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
