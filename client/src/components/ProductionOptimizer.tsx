import React, { useState, useRef } from 'react';
import { Upload, Play, Save, RotateCcw, Settings, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { realApiService } from '../services/realApiService';
import { ProductionItem } from '../types/index';
import * as XLSX from 'xlsx';
import { OptimizationResults } from './OptimizationResults';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const ProductionOptimizer: React.FC = () => {
  const [items, setItems] = useState<ProductionItem[]>([]);
  const [optimizedItems, setOptimizedItems] = useState<ProductionItem[]>([]);
  const [optimizationDetails, setOptimizationDetails] = useState<Record<string, any> | null>(null);
  const [tolerance, setTolerance] = useState<number>(5);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onerror = () => {
      setError(`Erro ao ler o arquivo: ${reader.error?.message || 'Erro desconhecido'}`);
      setSuccess(null);
      setItems([]);
      setOptimizedItems([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const sheetName = workbook.SheetNames.find(name => name.toLowerCase().includes('dados')) || workbook.SheetNames[0];
        if (!sheetName) {
          throw new Error('Aba "Dados" não encontrada no arquivo.');
        }

        const worksheet = workbook.Sheets[sheetName];
        const dataAsArray: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (dataAsArray.length < 2) {
          throw new Error('A planilha precisa ter um cabeçalho e pelo menos uma linha de dados.');
        }

        const header = dataAsArray[0].map(h => String(h).trim().toLowerCase());
        const requiredHeaders = ['referência', 'cor', 'tamanho', 'qtd'];
        
        const refIndex = header.indexOf('referência');
        const corIndex = header.indexOf('cor');
        const tamanhoIndex = header.indexOf('tamanho');
        const qtdIndex = header.indexOf('qtd');

        if (refIndex === -1 || corIndex === -1 || tamanhoIndex === -1 || qtdIndex === -1) {
          const missing = requiredHeaders.filter(h => !header.includes(h));
          throw new Error(`Cabeçalhos não encontrados: ${missing.join(', ')}. Verifique se a planilha contém os cabeçalhos 'Referência', 'Cor', 'Tamanho' e 'Qtd'.`);
        }

        const productionItems: ProductionItem[] = [];
        for (let i = 1; i < dataAsArray.length; i++) {
          const row = dataAsArray[i];

          if (!row || row.length === 0 || row.every(cell => cell === null || cell === '')) {
            continue; // Pular linhas vazias
          }

          const referencia = row[refIndex];
          const cor = row[corIndex];
          const tamanho = row[tamanhoIndex];
          const qtd = row[qtdIndex];

          if (!referencia || !cor || !tamanho || !qtd) {
            throw new Error(`Linha ${i + 1}: Todos os campos (Referência, Cor, Tamanho, Qtd) são obrigatórios.`);
          }

          const parsedQtd = parseFloat(String(qtd));
          if (isNaN(parsedQtd) || parsedQtd <= 0) {
            throw new Error(`Linha ${i + 1}: A quantidade ('Qtd') deve ser um número maior que zero.`);
          }

          productionItems.push({
            id: `${i}`,
            referencia: String(referencia),
            cor: String(cor),
            tamanho: String(tamanho),
            qtd: parsedQtd,
            qtd_otimizada: 0,
            diferenca: 0,
            editavel: true
          });
        }
        
        if (productionItems.length === 0) {
            throw new Error("Nenhum item válido encontrado na planilha. Verifique o conteúdo do arquivo.");
        }

        setItems(productionItems);
        setOptimizedItems([]);
        setError(null);
        setSuccess(`${productionItems.length} itens carregados com sucesso do arquivo.`);
      } catch (err) {
        const errorMessage = (err as Error).message;
        setError(`Erro ao processar arquivo: ${errorMessage}`);
        setSuccess(null);
        setItems([]);
        setOptimizedItems([]);
      } finally {
        // Limpar o valor do input de arquivo para permitir o re-upload do mesmo arquivo
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleOptimize = async () => {
    if (items.length === 0) {
      setError('Por favor, carregue um arquivo primeiro.');
      return;
    }
    setIsOptimizing(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await realApiService.optimizeProduction(items, tolerance);
      if (result.success) {
        setOptimizedItems(result.items);
        setOptimizationDetails(result.summary.optimizationDetails);
        setSuccess(`Otimização concluída! ${result.summary.increases} aumentos, ${result.summary.decreases} diminuições.`);
      } else {
        setError('Falha na otimização.');
      }
    } catch (err) {
      setError('Erro na otimização: ' + (err as Error).message);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSave = () => {
    if (optimizedItems.length === 0) {
      setError('Nenhum dado otimizado para salvar.');
      return;
    }
    try {
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
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      XLSX.writeFile(wb, `producao_otimizada_${timestamp}.xlsx`);
      setSuccess('Arquivo salvo com sucesso!');
    } catch (err) {
      setError('Erro ao salvar arquivo: ' + (err as Error).message);
    }
  };

  const handleReset = () => {
    setItems([]);
    setOptimizedItems([]);
    setOptimizationDetails(null);
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Settings className="h-6 w-6 mr-2" />Controles e Configurações</CardTitle>
          <CardDescription>Ajuste os parâmetros, carregue os dados e inicie a otimização.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="block text-sm font-medium text-foreground mb-2">Tolerância de Otimização: <span className="font-bold">{tolerance}%</span></label>
            <input
              type="range"
              min="0"
              max="50"
              value={tolerance}
              onChange={(e) => setTolerance(parseInt(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
              disabled={isOptimizing}
            />
            <div className="flex flex-wrap gap-3 pt-4">
              {items.length === 0 ? (
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50" disabled={isOptimizing}>
                  <Upload className="h-5 w-5 mr-2" />
                  Carregar Arquivo
                </button>
              ) : (
                <button onClick={handleOptimize} disabled={isOptimizing} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50">
                  {isOptimizing ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />Otimizando...</> : <><Play className="h-5 w-5 mr-2" />Otimizar</>}
                </button>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx,.xls" className="hidden" />
              <button onClick={handleReset} className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"><RotateCcw className="h-5 w-5 mr-2" />Resetar</button>
            </div>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-medium text-foreground mb-2">Instruções</h3>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>Carregue uma planilha Excel com colunas: Referência, Cor, Tamanho, Qtd.</li>
              <li>Ajuste a tolerância para permitir maior ou menor variação nas quantidades.</li>
              <li>Clique em "Otimizar" para o sistema calcular o melhor enfesto.</li>
              <li>Salve o resultado otimizado em um novo arquivo Excel.</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {(error || success) && (
        <div className={`p-4 rounded-md flex items-center gap-3 ${error ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-700'}`}>
          {error ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
          <p className="font-medium">{error || success}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center"><FileText className="h-6 w-6 mr-2" />Dados de Produção</CardTitle>
              <CardDescription>Visualize os dados originais ou os resultados da otimização.</CardDescription>
            </div>
            {optimizedItems.length > 0 && (
              <button onClick={handleSave} className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm">
                <Save className="h-4 w-4 mr-2" />
                Download
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {optimizedItems.length > 0 ? (
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">Dados Otimizados</h3>
              <OptimizationResults
                items={optimizedItems}
                onItemUpdate={setOptimizedItems}
                optimizationDetails={optimizationDetails}
              />
            </div>
          ) : items.length > 0 ? (
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">Dados Originais</h3>
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Referência</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tamanho</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Cor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Quantidade</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{item.referencia}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{item.tamanho}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{item.cor}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{item.qtd}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">Total de itens: {items.length}</div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Upload className="mx-auto h-12 w-12" />
              <h3 className="mt-2 text-sm font-semibold text-foreground">Nenhum arquivo carregado</h3>
              <p className="mt-1 text-sm">Carregue um arquivo Excel ou use os dados de exemplo para começar.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
