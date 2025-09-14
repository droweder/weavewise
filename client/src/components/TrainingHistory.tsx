import React, { useState, useEffect } from 'react';
import { realApiService } from '../services/realApiService';
import { TrainingHistoryEntry, OptimizationLog } from '../types';
import { FileUpload } from './FileUpload';
import { ModelMetrics } from './ModelMetrics';
import { TrainingDataViewer } from './TrainingDataViewer';
import { ModelComparison } from './ModelComparison';
import { Play, Calendar, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Trash2, BrainCircuit, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

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
        setError('Erro ao carregar dados da página.');
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
      setTrainingError('Ocorreu um erro inesperado ao treinar o modelo.');
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

  const handleDeleteTraining = (trainingId: string) => {
    setDeleteModal({ show: true, type: 'training', id: trainingId, title: 'Excluir Treinamento' });
  };

  const handleDeleteOptimization = (optimizationId: string) => {
    setDeleteModal({ show: true, type: 'optimization', id: optimizationId, title: 'Excluir Otimização' });
  };

  const confirmDelete = async () => {
    setDeletingId(deleteModal.id);
    try {
      if (deleteModal.type === 'training') {
        await realApiService.deleteTraining(deleteModal.id);
        const history = await realApiService.getTrainingHistory();
        setTrainingHistory(history);
      } else {
        await realApiService.deleteOptimization(deleteModal.id);
        const logs = await realApiService.getOptimizationLogs();
        setOptimizationLogs(logs);
      }
      setError(null);
      setDeleteModal({ show: false, type: 'training', id: '', title: '' });
    } catch (err) {
      setError(`Erro ao excluir ${deleteModal.type === 'training' ? 'treinamento' : 'otimização'}: ${(err as Error).message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ show: false, type: 'training', id: '', title: '' });
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString('pt-BR');

  const formatDuration = (start: string, end: string) => {
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    return diffMins > 0 ? `${diffMins} min ${diffSecs} seg` : `${diffSecs} segundos`;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BrainCircuit className="h-6 w-6 mr-2" />
              Treinar Novo Modelo
            </CardTitle>
            <CardDescription>
              Faça o upload de um arquivo (.xlsx, .xls, .csv) com dados históricos para treinar e atualizar o modelo de otimização.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileUpload
              onFileSelect={setTrainingFile}
              accept=".xlsx,.xls,.csv"
              loading={trainingLoading}
              error={trainingError || undefined}
              success={trainingSuccess}
              label="Arquivo de Dados"
              description="Selecione ou arraste o arquivo de treinamento."
            />
            <button
              onClick={handleTrainModel}
              disabled={trainingLoading || !trainingFile}
              className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Play className="h-5 w-5" />
              <span>{trainingLoading ? 'Treinando...' : 'Iniciar Treinamento'}</span>
            </button>
            {trainingSuccess && (
              <p className="mt-2 text-sm text-green-600 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                Modelo treinado com sucesso!
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Métricas do Modelo</CardTitle>
            <CardDescription>
              Visão geral do desempenho do modelo atual.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ModelMetrics />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="h-6 w-6 mr-2" />
            Histórico e Análise de Treinamentos
          </CardTitle>
          <CardDescription>
            Revise os treinamentos passados e compare o desempenho dos modelos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <button
              onClick={() => setShowModelComparison(!showModelComparison)}
              className="flex items-center text-sm font-medium text-primary hover:text-primary/90"
            >
              {showModelComparison ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
              Comparar Modelos
            </button>
            <button
              onClick={() => setShowTrainingData(!showTrainingData)}
              className="flex items-center text-sm font-medium text-primary hover:text-primary/90"
            >
              {showTrainingData ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
              Visualizar Dados de Treinamento
            </button>
          </div>

          {showModelComparison && <ModelComparison />}
          {showTrainingData && <TrainingDataViewer />}
          
          {loading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
          ) : error ? (
            <div className="text-destructive text-center py-8">{error}</div>
          ) : (
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    {['Data/Hora', 'Status', 'Duração', 'Exemplos', 'Detalhes', 'Ações'].map(header => (
                      <th key={header} className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {trainingHistory.map((entry) => (
                    <tr key={entry.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm"><div className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-muted-foreground" />{formatDate(entry.data_inicio)}</div></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm"><div className="flex items-center">{getStatusIcon(entry.status)}<span className="ml-2">{entry.status}</span></div></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{entry.data_fim ? formatDuration(entry.data_inicio, entry.data_fim) : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{entry.exemplos_processados}</td>
                      <td className="px-6 py-4 text-sm text-destructive">{entry.mensagem_erro}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button onClick={() => handleDeleteTraining(entry.id)} disabled={deletingId === entry.id} className="text-destructive hover:text-destructive/80 disabled:opacity-50" title="Excluir treinamento">
                          {deletingId === entry.id ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-destructive"></div> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logs de Otimização</CardTitle>
          <CardDescription>Logs de execuções de otimizações de produção.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
          ) : (
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    {['Data/Hora', 'Tolerância', 'Linhas', 'Resumo', 'Ações'].map(header => (
                      <th key={header} className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {optimizationLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm"><div className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-muted-foreground" />{formatDate(log.data_hora)}</div></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{log.tolerancia}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{log.linhas_processadas}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex space-x-4">
                          <span className="text-green-600">↑ {log.resumo.aumentos}</span>
                          <span className="text-red-600">↓ {log.resumo.diminuicoes}</span>
                          <span>= {log.resumo.inalterados}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button onClick={() => handleDeleteOptimization(log.id)} disabled={deletingId === log.id} className="text-destructive hover:text-destructive/80 disabled:opacity-50" title="Excluir otimização">
                          {deletingId === log.id ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-destructive"></div> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {deleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-xl max-w-md w-full mx-4 border">
            <div className="p-6 text-center">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-destructive/10">
                <Trash2 className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="text-lg leading-6 font-medium mt-4">{deleteModal.title}</h3>
              <div className="mt-2">
                <p className="text-sm text-muted-foreground">
                  Tem certeza que deseja excluir? Esta ação não pode ser desfeita.
                </p>
              </div>
              <div className="mt-6 flex space-x-4">
                <button onClick={cancelDelete} className="flex-1 bg-transparent py-2 px-4 border rounded-md shadow-sm text-sm font-medium hover:bg-accent focus:outline-none">
                  Cancelar
                </button>
                <button onClick={confirmDelete} disabled={deletingId === deleteModal.id} className="flex-1 bg-destructive text-destructive-foreground py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium hover:bg-destructive/90 disabled:opacity-50 flex items-center justify-center">
                  {deletingId === deleteModal.id ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Excluindo...</> : 'Excluir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
