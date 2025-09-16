import React, { useState, useCallback } from 'react';
import { realApiService } from '../services/realApiService';
import { ProductionItem } from '../types/index';
import * as XLSX from 'xlsx';
import { FileUpload } from './FileUpload';
import { OptimizationResults } from './OptimizationResults';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Upload, Settings, Play, FileText, Download, RotateCcw, AlertTriangle, CheckCircle } from 'lucide-react';

type Step = 'upload' | 'configure' | 'results';

export const ProductionOptimizer: React.FC = () => {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<ProductionItem[]>([]);
  const [optimizedItems, setOptimizedItems] = useState<ProductionItem[]>([]);
  const [optimizationDetails, setOptimizationDetails] = useState<Record<string, any> | null>(null);
  const [tolerance, setTolerance] = useState<number>(5);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((selectedFile: File) => {
    setError(null);
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onerror = () => {
      setError(`Erro ao ler o arquivo: ${reader.error?.message || 'Erro desconhecido'}`);
      setIsProcessing(false);
    };
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames.find(name => name.toLowerCase().includes('dados')) || workbook.SheetNames[0];
        if (!sheetName) throw new Error('Aba "Dados" não encontrada no arquivo.');
        const worksheet = workbook.Sheets[sheetName];
        const dataAsArray: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (dataAsArray.length < 2) throw new Error('A planilha precisa ter um cabeçalho e pelo menos uma linha de dados.');
        const header = dataAsArray[0].map(h => String(h).trim().toLowerCase());
        const requiredHeaders = ['referência', 'cor', 'tamanho', 'qtd'];
        const refIndex = header.indexOf('referência');
        const corIndex = header.indexOf('cor');
        const tamanhoIndex = header.indexOf('tamanho');
        const qtdIndex = header.indexOf('qtd');
        if (refIndex === -1 || corIndex === -1 || tamanhoIndex === -1 || qtdIndex === -1) {
          const missing = requiredHeaders.filter(h => !header.includes(h));
          throw new Error(`Cabeçalhos não encontrados: ${missing.join(', ')}.`);
        }
        const productionItems: ProductionItem[] = [];
        for (let i = 1; i < dataAsArray.length; i++) {
          const row = dataAsArray[i];
          if (!row || row.length === 0 || row.every(cell => cell === null || cell === '')) continue;
          const [referencia, cor, tamanho, qtd] = [row[refIndex], row[corIndex], row[tamanhoIndex], row[qtdIndex]];
          if (!referencia || !cor || !tamanho || !qtd) throw new Error(`Linha ${i + 1}: Todos os campos são obrigatórios.`);
          const parsedQtd = parseFloat(String(qtd));
          if (isNaN(parsedQtd) || parsedQtd <= 0) throw new Error(`Linha ${i + 1}: A quantidade ('Qtd') deve ser um número maior que zero.`);
          productionItems.push({
            id: `${i}`, referencia: String(referencia), cor: String(cor), tamanho: String(tamanho),
            qtd: parsedQtd, qtd_otimizada: 0, diferenca: 0, editavel: true
          });
        }
        if (productionItems.length === 0) throw new Error("Nenhum item válido encontrado na planilha.");
        if (productionItems.length > 5000) {
          throw new Error("O arquivo é muito grande para ser processado no navegador. Por favor, use um arquivo com menos de 5000 linhas.");
        }
        setFile(selectedFile);
        setItems(productionItems);
        setStep('configure');
      } catch (err) {
        setError(`Erro ao processar arquivo: ${(err as Error).message}`);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  }, []);

  const handleOptimize = useCallback(async () => {
    if (items.length === 0) return;
    setIsProcessing(true);
    setError(null);
    try {
      const result = await realApiService.optimizeProduction(items, tolerance);
      if (result.success) {
        setOptimizedItems(result.items);
        setOptimizationDetails(result.summary.optimizationDetails);
        setStep('results');
      } else {
        setError('Falha na otimização.');
      }
    } catch (err) {
      setError(`Erro na otimização: ${(err as Error).message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [items, tolerance]);

  const handleSave = useCallback(() => {
    if (optimizedItems.length === 0) {
      setError('Nenhum dado otimizado para salvar.');
      return;
    }
    try {
      const wsData = optimizedItems.map(item => ({
        'Referência': item.referencia, 'Tamanho': item.tamanho, 'Cor': item.cor,
        'Quantidade Original': item.qtd, 'Quantidade Otimizada': item.qtd_otimizada, 'Diferença': item.diferenca
      }));
      const ws = XLSX.utils.json_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Dados Otimizados');
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      XLSX.writeFile(wb, `producao_otimizada_${timestamp}.xlsx`);
    } catch (err) {
      setError(`Erro ao salvar arquivo: ${(err as Error).message}`);
    }
  }, [optimizedItems]);

  const handleReset = useCallback(() => {
    setStep('upload');
    setFile(null);
    setItems([]);
    setOptimizedItems([]);
    setOptimizationDetails(null);
    setError(null);
    setIsProcessing(false);
  }, []);

  const renderContent = () => {
    switch (step) {
      case 'upload':
        return (
          <Card>
            <CardHeader><CardTitle>1. Upload da Planilha</CardTitle><CardDescription>Carregue o arquivo Excel com os dados de produção para iniciar.</CardDescription></CardHeader>
            <CardContent>
              <FileUpload
                onFileSelect={handleFileSelect}
                loading={isProcessing}
                error={error || undefined}
                success={!!file && !error}
                label="Arquivo de Produção"
                description="Arraste e solte ou clique para selecionar um arquivo .xlsx ou .xls"
              />
            </CardContent>
          </Card>
        );
      case 'configure':
        return (
          <Card>
            <CardHeader><CardTitle>2. Configurar e Otimizar</CardTitle><CardDescription>Ajuste os parâmetros e inicie a otimização.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
               <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center"><CheckCircle className="h-5 w-5 text-green-600 mr-2" /><h3 className="font-medium text-green-800">Arquivo Carregado</h3></div>
                  <p className="text-sm text-green-700 mt-1"><b>{file?.name}</b> ({items.length} itens) foi carregado com sucesso.</p>
              </div>
              <div className="space-y-4">
                <label htmlFor="tolerance" className="block text-sm font-medium">Tolerância de Otimização: <span className="font-bold">{tolerance}%</span></label>
                <input
                  type="range"
                  id="tolerance"
                  min="0" max="50" value={tolerance}
                  onChange={(e) => setTolerance(parseInt(e.target.value))}
                  disabled={isProcessing}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button onClick={handleReset} disabled={isProcessing} className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
                  <RotateCcw className="h-4 w-4 mr-2" /> Começar de Novo
                </button>
                <button onClick={handleOptimize} disabled={isProcessing} className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
                  {isProcessing ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" /> : <Play className="h-4 w-4 mr-2" />} Otimizar
                </button>
              </div>
            </CardContent>
          </Card>
        );
      case 'results':
        return (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div><CardTitle>3. Resultados da Otimização</CardTitle><CardDescription>Visualize e salve os resultados otimizados.</CardDescription></div>
                <div className="flex space-x-2">
                  <button onClick={handleReset} className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <RotateCcw className="h-4 w-4 mr-2" />Nova Otimização
                  </button>
                  <button onClick={handleSave} className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                    <Download className="h-4 w-4 mr-2" />Download
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <OptimizationResults items={optimizedItems} onItemUpdate={setOptimizedItems} optimizationDetails={optimizationDetails} />
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center"><AlertTriangle className="h-5 w-5 text-red-600 mr-2" /><h3 className="font-medium text-red-800">Ocorreu um Erro</h3></div>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
      )}
      {renderContent()}
    </div>
  );
};
