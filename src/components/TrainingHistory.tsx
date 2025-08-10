import React, { useState, useEffect } from 'react';
import { realApiService } from '../services/realApiService';
import { TrainingHistoryEntry, OptimizationLog } from '../types';
import { FileUpload } from './FileUpload';
import { ModelMetrics } from './ModelMetrics';
import { TrainingDataViewer } from './TrainingDataViewer';
import { ModelComparison } from './ModelComparison';
import { Play, Calendar, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';

export const TrainingHistory: React.FC = () => {
  const [trainingHistory, setTrainingHistory] = useState<TrainingHistoryEntry[]>([]);
  const [optimizationLogs, setOptimizationLogs] = useState<OptimizationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trainingFile, setTrainingFile] = useState<File | null>(null);
  const [trainingLoading, setTrainingLoading] = useState(false);
  const [trainingError, setTrainingError] = useState<string | null>(null);
  const [trainingSuccess, setTrainingSuccess] = useState(false);
  const [showTrainingData, setShowTrainingData] = useState(false);
  const [showModelComparison, setShowModelComparison] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [history, logs] = await Promise.all([
          realApiService.getTrainingHistory(),
          realApiService.getOptimizationLogs()
        ]);
        setTrainingHistory(history);
        setOptimizationLogs(logs);
      } catch (err) {
        setError('Erro ao carregar histórico');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTrainModel = async () => {
    if (!trainingFile) return;

    setTrainingLoading(true);
    setTrainingError(null);
    setTrainingSuccess(false);

    try {
      const result = await realApiService.trainModel(trainingFile);
      if (result.success) {
        setTrainingSuccess(true);
        // Refresh training history
        const history = await realApiService.getTrainingHistory();
        setTrainingHistory(history);
      } else {
        setTrainingError(result.message);
      }
    } catch (err) {
      setTrainingError('Erro ao treinar modelo');
    } finally {
      setTrainingLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Sucesso':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'Falha':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    
    if (diffMins > 0) {
      return `${diffMins} min ${diffSecs} seg`;
    }
    return `${diffSecs} segundos`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Histórico de Treinamento</h1>

        {/* Model Metrics */}
        <ModelMetrics />

        {/* Training Section */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Treinar Novo Modelo</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FileUpload
              onFileSelect={setTrainingFile}
              accept=".xlsx,.xls,.csv"
              loading={trainingLoading}
              error={trainingError || undefined}
              success={trainingSuccess}
              label="Upload de Dados de Treinamento"
              description="Arquivo Excel ou CSV com dados históricos de produção"
            />
            
            <div className="flex flex-col justify-end">
              <button
                onClick={handleTrainModel}
                disabled={trainingLoading || !trainingFile}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Play className="h-5 w-5" />
                <span>{trainingLoading ? 'Treinando...' : 'Treinar Modelo'}</span>
              </button>
              
              {trainingSuccess && (
                <p className="mt-2 text-sm text-green-600">
                  Modelo treinado com sucesso!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Model Comparison Toggle */}
        <div className="mb-6">
          <button
            onClick={() => setShowModelComparison(!showModelComparison)}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            {showModelComparison ? (
              <>
                <ChevronUp className="h-5 w-5 mr-1" />
                Ocultar Comparação de Modelos
              </>
            ) : (
              <>
                <ChevronDown className="h-5 w-5 mr-1" />
                Comparar Modelos
              </>
            )}
          </button>
        </div>

        {/* Model Comparison */}
        {showModelComparison && (
          <div className="mb-10">
            <ModelComparison />
          </div>
        )}

        {/* Training Data Viewer Toggle */}
        <div className="mb-6">
          <button
            onClick={() => setShowTrainingData(!showTrainingData)}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            {showTrainingData ? (
              <>
                <ChevronUp className="h-5 w-5 mr-1" />
                Ocultar Dados de Treinamento
              </>
            ) : (
              <>
                <ChevronDown className="h-5 w-5 mr-1" />
                Visualizar Dados de Treinamento
              </>
            )}
          </button>
        </div>

        {/* Training Data Viewer */}
        {showTrainingData && (
          <div className="mb-10">
            <TrainingDataViewer />
          </div>
        )}

        {/* Training History */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Treinamentos</h2>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data/Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duração
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Exemplos Processados
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Detalhes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {trainingHistory.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {formatDate(entry.data_inicio)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center">
                          {getStatusIcon(entry.status)}
                          <span className="ml-2">{entry.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.data_fim ? formatDuration(entry.data_inicio, entry.data_fim) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.exemplos_processados}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {entry.mensagem_erro && (
                          <span className="text-red-600">{entry.mensagem_erro}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Optimization Logs */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Logs de Otimização</h2>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data/Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tolerância
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Linhas Processadas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resumo
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {optimizationLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {formatDate(log.data_hora)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.tolerancia}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.linhas_processadas}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex space-x-4">
                          <span className="text-green-600">
                            ↑ {log.resumo.aumentos}
                          </span>
                          <span className="text-red-600">
                            ↓ {log.resumo.diminuicoes}
                          </span>
                          <span className="text-gray-600">
                            = {log.resumo.inalterados}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
