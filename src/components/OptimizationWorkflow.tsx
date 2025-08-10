import React, { useState, useCallback } from 'react';
import { FileUpload } from './FileUpload';
import { OptimizationResults } from './OptimizationResults';
import { validateExcelData, parseExcelToProductionItems } from '../utils/excelValidator';
import { apiService } from '../services/api';
import { ProductionItem, OptimizationResult } from '../types';
import { Settings, Play, Download } from 'lucide-react';

export const OptimizationWorkflow: React.FC = () => {
  const [step, setStep] = useState<'upload' | 'configure' | 'results'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<ProductionItem[]>([]);
  const [tolerance, setTolerance] = useState<number>(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [results, setResults] = useState<OptimizationResult | null>(null);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setError('');
    setLoading(true);

    try {
      // Simulate reading Excel file
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock Excel data - in real implementation, use a library like xlsx
      const mockData = [
        ['Referência', 'Cor', 'Tamanho', 'Qtd'],
        ['REF001', 'Azul', 'P', '50'],
        ['REF001', 'Azul', 'M', '75'],
        ['REF001', 'Azul', 'G', '100'],
        ['REF002', 'Vermelho', 'P', '30'],
        ['REF002', 'Vermelho', 'M', '45'],
        ['REF002', 'Vermelho', 'G', '60'],
        ['REF003', 'Verde', 'P', '25'],
        ['REF003', 'Verde', 'M', '40'],
        ['REF003', 'Verde', 'G', '55']
      ];

      // Check for "Dados" sheet
      const hasDataSheet = selectedFile.name.includes('dados') || Math.random() > 0.3;
      
      if (!hasDataSheet) {
        setError('Aba "Dados" não encontrada.');
        return;
      }

      const validation = validateExcelData(mockData);
      
      if (!validation.valid) {
        setError(validation.errors.join('; '));
        return;
      }

      const parsedItems = parseExcelToProductionItems(mockData);
      
      if (parsedItems.length === 0) {
        setError('Nenhum item válido encontrado na planilha.');
        return;
      }

      setFile(selectedFile);
      setItems(parsedItems);
      setStep('configure');
    } catch (err) {
      setError('Erro ao processar arquivo. Verifique se é um arquivo Excel válido.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOptimize = useCallback(async () => {
    if (items.length === 0) return;

    setLoading(true);
    setError('');

    try {
      const result = await apiService.optimizeProduction(items, tolerance);
      setResults(result);
      setStep('results');
    } catch (err) {
      setError('Erro ao executar otimização. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [items, tolerance]);

  const handleDownload = useCallback(() => {
    if (!results) return;

    // In real implementation, generate Excel file
    const csvContent = [
      ['Referência', 'Cor', 'Tamanho', 'Qtd', 'Qtd_Otimizada', 'Diferença'].join(','),
      ...results.items.map(item => 
        [item.referencia, item.cor, item.tamanho, item.qtd, item.qtd_otimizada, item.diferenca].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'otimizacao_resultados.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }, [results]);

  const resetWorkflow = useCallback(() => {
    setStep('upload');
    setFile(null);
    setItems([]);
    setResults(null);
    setError('');
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Otimização de Corte</h1>
          
          {/* Progress indicators */}
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              step === 'upload' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
            }`}>
              <span className="w-2 h-2 rounded-full bg-current"></span>
              <span>Upload</span>
            </div>
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              step === 'configure' ? 'bg-blue-100 text-blue-800' : 
              step === 'results' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
            }`}>
              <span className="w-2 h-2 rounded-full bg-current"></span>
              <span>Configurar</span>
            </div>
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              step === 'results' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
            }`}>
              <span className="w-2 h-2 rounded-full bg-current"></span>
              <span>Resultados</span>
            </div>
          </div>
        </div>

        {step === 'upload' && (
          <div className="space-y-4">
            <FileUpload
              onFileSelect={handleFileSelect}
              loading={loading}
              error={error}
              success={!!file && !error}
              label="Upload da Planilha"
              description="Arquivo Excel (.xlsx) com aba 'Dados' contendo as colunas: Referência, Cor, Tamanho, Qtd"
            />
          </div>
        )}

        {step === 'configure' && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-800">
                  Arquivo carregado: {file?.name}
                </span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                {items.length} itens encontrados para otimização
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tolerância (%)
                </label>
                <div className="relative">
                  <Settings className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="1"
                    value={tolerance}
                    onChange={(e) => setTolerance(Number(e.target.value))}
                    className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="5"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Variação aceitável para cada item (± {tolerance}%)
                </p>
              </div>

              <div className="flex flex-col justify-end">
                <button
                  onClick={handleOptimize}
                  disabled={loading || items.length === 0}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <Play className="h-5 w-5" />
                  <span>{loading ? 'Otimizando...' : 'Executar Otimização'}</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>
        )}

        {step === 'results' && results && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold text-gray-900">Resultados da Otimização</h2>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-green-600">
                    ↑ {results.summary.increases} aumentos
                  </span>
                  <span className="text-red-600">
                    ↓ {results.summary.decreases} diminuições
                  </span>
                  <span className="text-gray-600">
                    = {results.summary.unchanged} inalterados
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleDownload}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2"
                >
                  <Download className="h-5 w-5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={resetWorkflow}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                >
                  Nova Otimização
                </button>
              </div>
            </div>

            <OptimizationResults
              items={results.items}
              onItemUpdate={(updatedItems) => 
                setResults({ ...results, items: updatedItems })
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};