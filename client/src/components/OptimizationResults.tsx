import React, { useState } from 'react';
import { ProductionItem } from '../types';
import { Save, X } from 'lucide-react';

// Função auxiliar para calcular MDC
const gcd = (a: number, b: number): number => {
  return b === 0 ? a : gcd(b, a % b);
};

const gcdMultiple = (numbers: number[]): number => {
  if (numbers.length === 0) return 1;
  if (numbers.length === 1) return numbers[0];
  
  let result = numbers[0];
  for (let i = 1; i < numbers.length; i++) {
    result = gcd(result, numbers[i]);
  }
  return result;
};

// Função para detectar camadas baseada na quantidade otimizada individual
const detectLayers = (items: any[], currentItem: any): number => {
  const quantity = currentItem.qtd_otimizada || currentItem.qtd;
  
  if (quantity <= 0) return 36;
  
  const commonDivisors = [36, 48, 24, 30, 42, 18, 12];
  for (const divisor of commonDivisors) {
    if (quantity % divisor === 0) {
      return divisor;
    }
  }
  
  // Buscar o maior divisor entre 6 e 60
  for (let i = 60; i >= 6; i--) {
    if (quantity % i === 0) {
      return i;
    }
  }
  
  return 36; // Default
};

interface OptimizationResultsProps {
  items: ProductionItem[];
  onItemUpdate: (updatedItems: ProductionItem[]) => void;
}

export const OptimizationResults: React.FC<OptimizationResultsProps> = ({ 
  items, 
  onItemUpdate 
}) => {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editedValue, setEditedValue] = useState<number>(0);

  const handleEditStart = (item: ProductionItem) => {
    setEditingItemId(item.id);
    setEditedValue(item.qtd_otimizada || item.qtd);
  };

  const handleEditSave = (item: ProductionItem) => {
    if (editingItemId !== null) {
      const updatedItems = items.map(i => 
        i.id === item.id ? { ...i, qtd_otimizada: editedValue } : i
      );
      onItemUpdate(updatedItems);
      setEditingItemId(null);
    }
  };

  const handleEditCancel = () => {
    setEditingItemId(null);
  };

  const handleValueChange = (value: number, item: ProductionItem) => {
    const updatedItems = items.map(i => 
      i.id === item.id ? { ...i, qtd_otimizada: value } : i
    );
    onItemUpdate(updatedItems);
  };

  // Calcular estatísticas
  const totalOriginal = items.reduce((sum, item) => sum + item.qtd, 0);
  const totalOtimizado = items.reduce((sum, item) => sum + (item.qtd_otimizada || item.qtd), 0);
  const diferencaTotal = totalOtimizado - totalOriginal;
  const percentualDiferenca = totalOriginal > 0 ? (diferencaTotal / totalOriginal) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Resumo estatístico */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-800">Total Original</p>
          <p className="text-2xl font-bold text-blue-900">{totalOriginal}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-green-800">Total Otimizado</p>
          <p className="text-2xl font-bold text-green-900">{totalOtimizado}</p>
        </div>
        <div className={`rounded-lg p-4 ${diferencaTotal >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <p className="text-sm text-gray-800">Diferença</p>
          <p className={`text-2xl font-bold ${diferencaTotal >= 0 ? 'text-green-900' : 'text-red-900'}`}>
            {diferencaTotal >= 0 ? '+' : ''}{diferencaTotal}
          </p>
        </div>
        <div className={`rounded-lg p-4 ${percentualDiferenca >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <p className="text-sm text-gray-800">Variação (%)</p>
          <p className={`text-2xl font-bold ${percentualDiferenca >= 0 ? 'text-green-900' : 'text-red-900'}`}>
            {percentualDiferenca >= 0 ? '+' : ''}{percentualDiferenca.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Tabela de resultados */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Referência
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tamanho
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Qtd Original
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Qtd Otimizada
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Camadas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Repetições
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Diferença
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.referencia}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.tamanho}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.cor}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.qtd}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {editingItemId === item.id ? (
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={editedValue}
                        onChange={(e) => setEditedValue(Number(e.target.value))}
                        className="w-20 rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        autoFocus
                        min="0"
                      />
                      <button
                        onClick={() => handleEditSave(item)}
                        className="ml-2 text-green-600 hover:text-green-900"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleEditCancel}
                        className="ml-1 text-red-600 hover:text-red-900"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <span className={item.qtd_otimizada !== item.qtd ? 'font-semibold' : ''}>
                      {item.qtd_otimizada}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="font-semibold text-green-600">
                    {detectLayers(items, item)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="font-semibold text-blue-600">
                    {Math.round((item.qtd_otimizada || item.qtd) / Math.max(1, detectLayers(items, item)))}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={
                    item.diferenca && item.diferenca > 0 
                      ? 'text-green-600 font-semibold' 
                      : item.diferenca && item.diferenca < 0 
                        ? 'text-red-600 font-semibold' 
                        : 'text-gray-500'
                  }>
                    {item.diferenca !== undefined ? (
                      item.diferenca > 0 ? `+${item.diferenca}` : item.diferenca
                    ) : '0'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {editingItemId === item.id ? null : (
                    <button
                      onClick={() => handleEditStart(item)}
                      className="text-blue-600 hover:text-blue-900"
                      disabled={!item.editavel}
                    >
                      Editar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
