import React, { useState, useEffect, useCallback } from 'react';
import { FileUpload } from './FileUpload';
import { apiService } from '../services/api';
import { TrainingHistoryEntry } from '../types';
import { RefreshCw, Calendar, Users, AlertCircle, CheckCircle, Upload } from 'lucide-react';

export const TrainingHistory: React.FC = () => {
  const [history, setHistory] = useState<TrainingHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await apiService.getTrainingHistory();
      setHistory(data);
    } catch (err) {
      setError('Erro ao carregar histórico de treinamento');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleTrainingFileUpload = useCallback(async (file: File) => {
    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const result = await apiService.trainModel(file);
      
      if (result.success) {
        setSuccess(`Treinamento executado com sucesso: ${result.message}`);
        // Reload history after training
        setTimeout(() => {
          loadHistory();
        }, 1000);
      } else {
        setError(`Erro no treinamento: ${result.message}`);
      }
    } catch (err) {
      setError('Erro ao executar treinamento do modelo');
    } finally {
      setUploading(false);
    }
  }, [loadHistory]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getStatusIcon = (status: string) => {
    return status === 'Sucesso' ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <AlertCircle className="h-5 w-5 text-red-600" />
    );
  };

  const getStatusColor = (status: string) => {
    return status === 'Sucesso' 
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Upload className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Novo Treinamento</h2>
        </div>
        
        <FileUpload
          onFileSelect={handleTrainingFileUpload}
          loading={uploading}
          error={error}
          success={!!success}
          label="Upload de Arquivo de Treinamento"
          description="Arquivo Excel (.xlsx) com colunas: Referência, Cor, Tamanho, Qtd, Qtd_Otimizada"
        />

        {success && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-sm text-green-800">{success}</p>
            </div>
          </div>
        )}
      </div>

      {/* History Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Calendar className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">Histórico de Treinamento</h1>
          </div>
          
          <button
            onClick={loadHistory}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>

        {loading && !history.length ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Carregando histórico...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum registro de treinamento encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Início
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fim
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Exemplos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mensagem/Erro
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {entry.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(entry.data_inicio)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(entry.data_fim)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}>
                        {getStatusIcon(entry.status)}
                        <span>{entry.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.exemplos_processados.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {entry.mensagem_erro || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};