import React, { useState } from 'react';
import { BarChart3, History } from 'lucide-react';
import { ProductionOptimizer } from './ProductionOptimizer';
import { TrainingHistory } from './TrainingHistory';

interface LayoutProps {
  onLogout: () => void;
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ onLogout, children }) => {
  const [currentView, setCurrentView] = useState<'optimization' | 'training-history'>('optimization');

  const handleViewChange = (view: 'optimization' | 'training-history') => {
    setCurrentView(view);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Weavewise</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Sistema de Otimização Têxtil</span>
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => handleViewChange('optimization')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                currentView === 'optimization'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="h-5 w-5 mr-2" />
              Otimização de Corte
            </button>
            
            <button
              onClick={() => handleViewChange('training-history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                currentView === 'training-history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <History className="h-5 w-5 mr-2" />
              Histórico de Treinamento
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {currentView === 'optimization' ? (
            <div className="px-4 py-6 sm:px-0">
              <ProductionOptimizer />
            </div>
          ) : (
            <div className="px-4 py-6 sm:px-0">
              <TrainingHistory />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
