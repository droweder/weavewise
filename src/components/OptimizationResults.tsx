import React, { useState, useCallback } from 'react';
import { ProductionItem } from '../types';
import { Edit3, Check, X, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface OptimizationResultsProps {
  items: ProductionItem[];
  onItemUpdate: (items: ProductionItem[]) => void;
}

export const OptimizationResults: React.FC<OptimizationResultsProps> = ({
  items,
  onItemUpdate
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  const handleEdit = useCallback((item: ProductionItem) => {
    setEditingId(item.id || '');
    setEditValue(item.qtd_otimizada || 0);
  }, []);

  const handleSave = useCallback((itemId: string) => {
    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        const qtd_otimizada = editValue;
        const diferenca = qtd_otimizada - item.qtd;
        return { ...item, qtd_otimizada, diferenca };
      }
      return item;
    });
    
    onItemUpdate(updatedItems);
    setEditingId(null);
  }, [items, editValue, onItemUpdate]);

  const handleCancel = useCallback(() => {
    setEditingId(null);
  }, []);

  const getDifferenceIcon = (diferenca: number) => {
    if (diferenca > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (diferenca < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getDifferenceColor = (diferenca: number) => {
    if (diferenca > 0) return 'text-green-600 bg-green-50';
    if (diferenca < 0) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Referência
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tamanho
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Qtd Original
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Qtd Otimizada
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.cor}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.tamanho}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.qtd}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {editingId === item.id ? (
                    <input
                      type="number"
                      min="1"
                      value={editValue}
                      onChange={(e) => setEditValue(Number(e.target.value))}
                      className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      autoFocus
                    />
                  ) : (
                    <span className="font-medium">
                      {item.qtd_otimizada}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getDifferenceColor(item.diferenca || 0)}`}>
                    {getDifferenceIcon(item.diferenca || 0)}
                    <span>{item.diferenca > 0 ? '+' : ''}{item.diferenca}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {editingId === item.id ? (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleSave(item.id || '')}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleCancel}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Edit3 className="h-4 w-4" />
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