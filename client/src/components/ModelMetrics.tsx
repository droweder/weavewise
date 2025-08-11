import React, { useState, useEffect } from 'react';
import { realApiService } from '../services/realApiService';
import { BarChart, TrendingUp, Database, Clock } from 'lucide-react';

export const ModelMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState({
    totalTrainings: 0,
    lastTraining: '',
    activeModel: '',
    accuracy: 0,
    totalOptimizations: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Obter dados do usuário
        const { data: { user } } = await realApiService.getCurrentUser();
        if (!user) return;

        // Obter estatísticas de treinamento
        const trainingHistory = await realApiService.getTrainingHistory();
        const optimizationLogs = await realApiService.getOptimizationLogs();
        
        // Obter modelo ativo
        const { data: modelData } = await realApiService.supabase
          .from('model_weights')
          .select('version, created_at')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();
        
        setMetrics({
          totalTrainings: trainingHistory.length,
          lastTraining: trainingHistory[0]?.data_inicio || 'Nenhum treinamento',
          activeModel: modelData?.version || 'Nenhum modelo ativo',
          accuracy: 85, // Valor simulado - em implementação real, calcular com base em dados reais
          totalOptimizations: optimizationLogs.length
        });
      } catch (error) {
        console.error('Erro ao carregar métricas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-blue-100 text-blue-600">
            <Database className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total de Treinamentos</p>
            <p className="text-2xl font-semibold text-gray-900">{metrics.totalTrainings}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-green-100 text-green-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Precisão do Modelo</p>
            <p className="text-2xl font-semibold text-gray-900">{metrics.accuracy}%</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-purple-100 text-purple-600">
            <BarChart className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Otimizações Realizadas</p>
            <p className="text-2xl font-semibold text-gray-900">{metrics.totalOptimizations}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
            <Clock className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Último Treinamento</p>
            <p className="text-lg font-semibold text-gray-900">
              {metrics.lastTraining !== 'Nenhum treinamento' 
                ? formatDate(metrics.lastTraining) 
                : 'Nenhum treinamento'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
