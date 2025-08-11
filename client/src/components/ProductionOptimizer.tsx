import React, { useState, useRef } from 'react';
import { Upload, Play, Save, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { realApiService } from '../services/realApiService';
import { ProductionItem } from '../types';
import * as XLSX from 'xlsx';

export const ProductionOptimizer: React.FC = () => {
  const [items, setItems] = useState<ProductionItem[]>([]);
  const [optimizedItems, setOptimizedItems] = useState<ProductionItem[]>([]);
  const [tolerance, setTolerance] = useState<number>(5);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [showOptimized, setShowOptimized] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Procurar pela aba "Dados"
        const sheetName = workbook.SheetNames.find(name => 
          name.toLowerCase().includes('dados')
        ) || workbook.SheetNames[0];
        
        if (!sheetName) {
          throw new Error('Aba "Dados" não encontrada');
        }
        
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);
        
        // Converter para o formato esperado
        const productionItems: ProductionItem[] = jsonData.map((row, index) => ({
          id: `${index + 1}`,
          referencia: row.Referência || row.referencia || row['Referência'] || '',
          cor: row.Cor || row.cor || row['Cor'] || '',
          tamanho: row.Tamanho || row.tamanho || row['Tamanho'] || '',
          qtd: typeof row.Qtd === 'number' ? row.Qtd : parseFloat(row.Qtd) || 0,
          qtd_otimizada: 0,
          diferenca: 0,
          editavel: true
        }));
        
        setItems(productionItems);
        setOptimizedItems([]);
        setError(null);
        setSuccess(null);
      } catch (err) {
        setError('Erro ao processar arquivo: ' + (err as Error).message);
        console.error('Erro ao processar arquivo:', err);
      }
    };
    
    reader.readAsArrayBuffer(file);
  };

  const handleOptimize = async () => {
    if (items.length === 0) {
      setError('Por favor, faça o upload de um arquivo primeiro');
      return;
    }

    setIsOptimizing(true);
    setError(null);
    
    try {
      const result = await realApiService.optimizeProduction(items, tolerance);
      
      if (result.success) {
        setOptimizedItems(result.items);
        setSuccess(`Otimização concluída! ${result.summary.increases} aumentos, ${result.summary.decreases} diminuições.`);
      } else {
        setError('Falha na otimização');
      }
    } catch (err) {
      setError('Erro na otimização: ' + (err as Error).message);
      console.error('Erro na otimização:', err);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSave = () => {
    if (optimizedItems.length === 0) {
      setError('Nenhum dado otimizado para salvar');
      return;
    }

    try {
      // Criar planilha com dados otimizados
      const wsData = optimizedItems.map(item => ({
        'Referência': item.referencia,
        'Tamanho': item.tamanho,
        'Cor': item.cor,
        'Quantidade Original': item.qtd,
        'Quantidade Otimizada': item.qtd_otimizada,
        'Diferença': item.diferenca
      }));
      
      const ws = XLSX.utils.json_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Dados Otimizados');
      
      // Gerar nome de arquivo com timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      XLSX.writeFile(wb, `producao_otimizada_${timestamp}.xlsx`);
      
      setSuccess('Arquivo salvo com sucesso!');
    } catch (err) {
      setError('Erro ao salvar arquivo: ' + (err as Error).message);
      console.error('Erro ao salvar arquivo:', err);
    }
  };

  const handleReset = () => {
    setItems([]);
    setOptimizedItems([]);
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleView = () => {
    setShowOptimized(!showOptimized);
  };

  const handleToleranceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      setTolerance(value);
    }
  };

  // Função para carregar dados de exemplo típicos de enfesto
  const loadSampleData = () => {
    const sampleItems: ProductionItem[] = [
      { id: '1', referencia: 'CAM001', cor: 'Azul Marinho', tamanho: 'P', qtd: 47, qtd_otimizada: 0, diferenca: 0, editavel: true },
      { id: '2', referencia: 'CAM001', cor: 'Azul Marinho', tamanho: 'M', qtd: 163, qtd_otimizada: 0, diferenca: 0, editavel: true },
      { id: '3', referencia: 'CAM001', cor: 'Azul Marinho', tamanho: 'G', qtd: 122, qtd_otimizada: 0, diferenca: 0, editavel: true },
      { id: '4', referencia: 'CAM001', cor: 'Azul Marinho', tamanho: 'GG', qtd: 38, qtd_otimizada: 0, diferenca: 0, editavel: true },
      { id: '5', referencia: 'CAM001', cor: 'Branco', tamanho: 'P', qtd: 23, qtd_otimizada: 0, diferenca: 0, editavel: true },
      { id: '6', referencia: 'CAM001', cor: 'Branco', tamanho: 'M', qtd: 89, qtd_otimizada: 0, diferenca: 0, editavel: true },
      { id: '7', referencia: 'CAM001', cor: 'Branco', tamanho: 'G', qtd: 67, qtd_otimizada: 0, diferenca: 0, editavel: true },
      { id: '8', referencia: 'CAM001', cor: 'Branco', tamanho: 'GG', qtd: 19, qtd_otimizada: 0, diferenca: 0, editavel: true },
      { id: '9', referencia: 'VEST002', cor: 'Preto', tamanho: 'M', qtd: 234, qtd_otimizada: 0, diferenca: 0, editavel: true },
      { id: '10', referencia: 'VEST002', cor: 'Preto', tamanho: 'G', qtd: 156, qtd_otimizada: 0, diferenca: 0, editavel: true }
    ];
    
    setItems(sampleItems);
    setOptimizedItems([]);
    setError(null);
    setSuccess('Exemplo de dados de enfesto carregado! Estes são valores típicos encontrados na indústria têxtil.');
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Otimização de Enfesto de Corte</h2>
      
      {/* Controles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tolerância (%)
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="0"
                max="50"
                value={tolerance}
                onChange={handleToleranceChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                disabled={isOptimizing}
              />
              <span className="text-lg font-medium text-gray-700 w-12">{tolerance}%</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={isOptimizing}
            >
              <Upload className="h-5 w-5 mr-2" />
              Upload Excel
            </button>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx,.xls"
              className="hidden"
            />
            
            <button
              onClick={handleOptimize}
              disabled={items.length === 0 || isOptimizing}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isOptimizing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Otimizando...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Otimizar
                </>
              )}
            </button>
            
            <button
              onClick={handleSave}
              disabled={optimizedItems.length === 0}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              <Save className="h-5 w-5 mr-2" />
              Salvar
            </button>
            
            <button
              onClick={handleReset}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Resetar
            </button>
            
            <button
              onClick={loadSampleData}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Carregar Exemplo
            </button>
          </div>
        </div>
        
        <div className="flex flex-col justify-center">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">Instruções</h3>
            <ul className="text-sm text-blue-700 list-disc pl-5 space-y-1">
              <li>Faça upload de uma planilha Excel com dados de corte (referência, cor, tamanho, qtd)</li>
              <li>O sistema otimiza quantidades para enfesto eficiente (múltiplos ideais, menos repetições)</li>
              <li>Ajuste a tolerância para flexibilidade nas otimizações</li>
              <li>Baseado em padrões históricos de analistas experientes</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Mensagens de erro/sucesso */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-700">{success}</p>
        </div>
      )}
      
      {/* Visualização de dados */}
      {items.length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-800">
              {showOptimized && optimizedItems.length > 0 
                ? 'Dados Otimizados' 
                : 'Dados Originais'}
            </h3>
            <button
              onClick={toggleView}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              {showOptimized ? (
                <>
                  <EyeOff className="h-4 w-4 mr-1" />
                  Ocultar Otimizados
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-1" />
                  Mostrar Otimizados
                </>
              )}
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referência</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tamanho</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantidade</th>
                  {showOptimized && optimizedItems.length > 0 && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd Otimizada</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diferença</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(showOptimized && optimizedItems.length > 0 ? optimizedItems : items).map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.referencia}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.tamanho}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.cor}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.qtd}</td>
                    {showOptimized && optimizedItems.length > 0 && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.qtd_otimizada}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                          (item.diferenca || 0) > 0 ? 'text-green-600' : 
                          (item.diferenca || 0) < 0 ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {(item.diferenca || 0) > 0 ? '+' : ''}{item.diferenca}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            Total de itens: {items.length}
          </div>
        </div>
      )}
      
      {/* Placeholder quando não há dados */}
      {items.length === 0 && !isOptimizing && (
        <div className="text-center py-12">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum arquivo carregado</h3>
          <p className="mt-1 text-sm text-gray-500">
            Faça upload de um arquivo Excel ou carregue dados de exemplo para começar.
          </p>
        </div>
      )}
    </div>
  );
};


