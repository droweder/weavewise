import React, { useState } from 'react';
import { ProductionItem } from '../types/index';
import { Save, X, Edit, Cpu, BookOpen, ShieldCheck } from 'lucide-react';

interface OptimizationResultsProps {
  items: ProductionItem[];
  onItemUpdate: (updatedItems: ProductionItem[]) => void;
  optimizationDetails: Record<string, any> | null;
}

export const OptimizationResults: React.FC<OptimizationResultsProps> = ({ 
  items, 
  onItemUpdate,
  optimizationDetails
}) => {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editedValue, setEditedValue] = useState<number>(0);

  const handleEditStart = (item: ProductionItem) => {
    setEditingItemId(item.id);
    setEditedValue(item.qtd_otimizada || 0);
  };

  const handleEditSave = (itemId: string) => {
    const updatedItems = items.map(i => {
      if (i.id === itemId) {
        return { ...i, qtd_otimizada: editedValue, diferenca: editedValue - i.qtd };
      }
      return i;
    });
    onItemUpdate(updatedItems);
    setEditingItemId(null);
  };

  const handleEditCancel = () => {
    setEditingItemId(null);
  };

  const getMethodTag = (item: ProductionItem) => {
    const key = `${item.referencia}-${item.cor}`;
    const details = optimizationDetails?.[key];

    if (!details) {
      return <span className="text-xs text-muted-foreground">N/A</span>;
    }

    const method = details.method || '';
    let icon = <BookOpen className="h-3 w-3" />;
    let color = 'bg-gray-100 text-gray-800';

    if (method.includes('Modelo')) {
      icon = <Cpu className="h-3 w-3" />;
      color = 'bg-blue-100 text-blue-800';
    } else if (method.includes('Tolerância')) {
      icon = <ShieldCheck className="h-3 w-3" />;
      color = 'bg-green-100 text-green-800';
    }

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
        {icon}
        <span className="ml-1">{method}</span>
      </span>
    );
  };

  const totalOriginal = items.reduce((sum, item) => sum + item.qtd, 0);
  const totalOtimizado = items.reduce((sum, item) => sum + (item.qtd_otimizada || 0), 0);
  const diferencaTotal = totalOtimizado - totalOriginal;
  const percentualDiferenca = totalOriginal > 0 ? (diferencaTotal / totalOriginal) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <p className="text-sm font-medium text-muted-foreground">Total Original</p>
          <p className="text-2xl font-semibold">{totalOriginal}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <p className="text-sm font-medium text-muted-foreground">Total Otimizado</p>
          <p className="text-2xl font-semibold">{totalOtimizado}</p>
        </div>
        <div className={`bg-muted/50 rounded-lg p-4 text-center`}>
          <p className="text-sm font-medium text-muted-foreground">Diferença</p>
          <p className={`text-2xl font-semibold ${diferencaTotal >= 0 ? 'text-green-600' : 'text-destructive'}`}>
            {diferencaTotal >= 0 ? '+' : ''}{diferencaTotal}
          </p>
        </div>
        <div className={`bg-muted/50 rounded-lg p-4 text-center`}>
          <p className="text-sm font-medium text-muted-foreground">Variação (%)</p>
          <p className={`text-2xl font-semibold ${percentualDiferenca >= 0 ? 'text-green-600' : 'text-destructive'}`}>
            {percentualDiferenca >= 0 ? '+' : ''}{percentualDiferenca.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Referência</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Tamanho</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Cor</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Qtd Original</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Qtd Otimizada</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Diferença</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Camadas</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Repetições</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Método</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {items.map((item) => {
              const key = `${item.referencia}-${item.cor}`;
              const details = optimizationDetails?.[key];
              const camadas = details?.bestStackHeight || 0;
              const repeticoes = camadas > 0 ? Math.round((item.qtd_otimizada || 0) / camadas) : 0;

              return (
              <tr key={item.id} className="hover:bg-muted/50">
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">{item.referencia}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">{item.tamanho}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">{item.cor}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">{item.qtd}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  {editingItemId === item.id ? (
                    <input
                      type="number"
                      value={editedValue}
                      onChange={(e) => setEditedValue(Number(e.target.value))}
                      className="w-24 p-1 rounded border-input bg-background shadow-sm focus:border-primary focus:ring-primary"
                      autoFocus
                      min="0"
                    />
                  ) : (
                    <span className={item.diferenca !== 0 ? 'font-semibold' : ''}>{item.qtd_otimizada}</span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  <span className={item.diferenca > 0 ? 'text-green-600 font-semibold' : item.diferenca < 0 ? 'text-destructive font-semibold' : 'text-muted-foreground'}>
                    {item.diferenca > 0 ? `+${item.diferenca}` : item.diferenca}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">{camadas}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-purple-600">{repeticoes}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">{getMethodTag(item)}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  {editingItemId === item.id ? (
                    <div className="flex items-center space-x-2">
                      <button onClick={() => handleEditSave(item.id)} className="text-green-600 hover:text-green-700"><Save className="h-4 w-4" /></button>
                      <button onClick={handleEditCancel} className="text-destructive hover:text-destructive/80"><X className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <button onClick={() => handleEditStart(item)} className="text-primary hover:text-primary/80" disabled={!item.editavel}><Edit className="h-4 w-4" /></button>
                  )}
                </td>
              </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
