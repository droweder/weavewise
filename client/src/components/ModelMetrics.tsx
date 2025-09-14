import React, { useState, useEffect } from 'react';
import { realApiService } from '../services/realApiService';
import { BarChart, TrendingUp, Database, Clock } from 'lucide-react';

// Define a reusable Metric Item component
const MetricItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) => (
  <div className="flex items-center space-x-4">
    <div className="p-3 rounded-full bg-muted text-muted-foreground">
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  </div>
);

export const ModelMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState({
    totalTrainings: 0,
    lastTraining: '',
    accuracy: 0,
    totalOptimizations: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { data: { user } } = await realApiService.getCurrentUser();
        if (!user) return;

        const trainingHistory = await realApiService.getTrainingHistory();
        const optimizationLogs = await realApiService.getOptimizationLogs();
        
        setMetrics({
          totalTrainings: trainingHistory.length,
          lastTraining: trainingHistory[0]?.data_inicio || 'N/A',
          accuracy: 85, // Simulated value
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
    if (dateString === 'N/A') return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-muted"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-6 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-4">
      <MetricItem
        icon={<Database className="h-6 w-6" />}
        label="Total de Treinamentos"
        value={metrics.totalTrainings}
      />
      <MetricItem
        icon={<TrendingUp className="h-6 w-6" />}
        label="Precisão (Simulada)"
        value={`${metrics.accuracy}%`}
      />
      <MetricItem
        icon={<BarChart className="h-6 w-6" />}
        label="Otimizações Realizadas"
        value={metrics.totalOptimizations}
      />
      <MetricItem
        icon={<Clock className="h-6 w-6" />}
        label="Último Treinamento"
        value={formatDate(metrics.lastTraining)}
      />
    </div>
  );
};
