import React, { useState, useEffect } from 'react';
import { realApiService } from '../services/realApiService';
import { TrainingHistoryEntry, OptimizationLog } from '../types';
import { FileUpload } from './FileUpload';
import { ModelMetrics } from './ModelMetrics';
import { TrainingDataViewer } from './TrainingDataViewer';
import { ModelComparison } from './ModelComparison';
import { Play, Calendar, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; type: 'training' | 'optimization'; id: string; title?: string }>({ 
    show: false, 
    type: 'training', 
    id: '',
    title: '' 
  });

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

  const handleDeleteTraining = async (trainingId: string) => {
    setDeleteModal({ 
      show: true, 
      type: 'training', 
      id: trainingId,
      title: 'Excluir Treinamento'
    });
  };

  const handleDeleteOptimization = async (optimizationId: string) => {
    setDeleteModal({ 
      show: true, 
      type: 'optimization', 
      id: optimizationId,
      title: 'Excluir Otimização'
    });
  };

  const confirmDelete = async () => {
    setDeletingId(deleteModal.id);
    try {
      if (deleteModal.type === 'training') {
        await realApiService.deleteTraining(deleteModal.id);
        // Refresh training history
        const history = await realApiService.getTrainingHistory();
        setTrainingHistory(history);
      } else {
        await realApiService.deleteOptimization(deleteModal.id);
        // Refresh optimization logs
        const logs = await realApiService.getOptimizationLogs();
        setOptimizationLogs(logs);
      }
      
      setError(null);
      setDeleteModal({ show: false, type: 'training', id: '', title: '' });
    } catch (err) {
      setError(`Erro ao excluir ${deleteModal.type === 'training' ? 'treinamento' : 'otimização'}: ` + (err as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ show: false, type: 'training', id: '', title: '' });
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDeleteTraining(entry.id)}
                          disabled={deletingId === entry.id}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                          title="Excluir treinamento"
                        >
                          {deletingId === entry.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDeleteOptimization(log.id)}
                          disabled={deletingId === log.id}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                          title="Excluir otimização"
                        >
                          {deletingId === log.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal de Confirmação de Exclusão */}
        {deleteModal.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                
                <div className="text-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                    {deleteModal.title}
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Tem certeza que deseja excluir {deleteModal.type === 'training' ? 'este treinamento' : 'esta otimização'}? 
                      Esta ação não pode ser desfeita.
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 flex space-x-4">
                  <button
                    onClick={cancelDelete}
                    className="flex-1 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={deletingId === deleteModal.id}
                    className="flex-1 bg-red-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {deletingId === deleteModal.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Excluindo...
                      </>
                    ) : (
                      'Excluir'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
