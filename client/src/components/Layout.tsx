import React, { useState } from 'react';
import { BarChart3, History, BookOpen } from 'lucide-react';
import { ProductionOptimizer } from './ProductionOptimizer';
import { TrainingHistory } from './TrainingHistory';
import { Documentation } from './Documentation';
import { ModeToggle } from './ThemeToggle';

interface LayoutProps {
  onLogout: () => void;
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ onLogout, children }) => {
  const [currentView, setCurrentView] = useState<'optimization' | 'training' | 'documentation'>('optimization');

  const handleViewChange = (view: 'optimization' | 'training' | 'documentation') => {
    setCurrentView(view);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="bg-card shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-foreground">Weavewise</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">Sistema de Otimização Têxtil</span>
              <ModeToggle />
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => handleViewChange('optimization')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                currentView === 'optimization'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <BarChart3 className="h-5 w-5 mr-2" />
              Otimização de Corte
            </button>
            
            <button
              onClick={() => handleViewChange('training')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                currentView === 'training'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <History className="h-5 w-5 mr-2" />
              Treinamento
            </button>
            
            <button
              onClick={() => handleViewChange('documentation')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                currentView === 'documentation'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <BookOpen className="h-5 w-5 mr-2" />
              Documentação
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
          ) : currentView === 'training' ? (
            <div className="px-4 py-6 sm:px-0">
              <TrainingHistory />
            </div>
          ) : (
            <div className="px-4 py-6 sm:px-0">
              <Documentation />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
