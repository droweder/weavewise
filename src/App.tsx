import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { OptimizationWorkflow } from './components/OptimizationWorkflow';
import { TrainingHistory } from './components/TrainingHistory';

function App() {
  const [currentView, setCurrentView] = useState<'optimization' | 'training-history'>('optimization');

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      {currentView === 'optimization' && <OptimizationWorkflow />}
      {currentView === 'training-history' && <TrainingHistory />}
    </Layout>
  );
}

export default App;