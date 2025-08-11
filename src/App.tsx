import React, { useState, useEffect } from 'react';
import { Auth } from './components/Auth';
import { Layout } from './components/Layout';
import { realApiService } from './services/realApiService';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar se o usuário já está autenticado
    const checkAuthStatus = async () => {
      try {
        const authenticated = await realApiService.isAuthenticated();
        setIsAuthenticated(authenticated);
      } catch (error) {
        console.warn('Auth check failed, continuing with mock mode:', error);
        setError('Modo demonstração - Supabase não configurado');
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();

    // Listener para mudanças no estado de autenticação
    const initializeAuthListener = async () => {
      try {
        const { data: authListener } = realApiService.supabase.auth.onAuthStateChange(
          (event, session) => {
            setIsAuthenticated(!!session?.user);
          }
        );

        // Cleanup listener
        return () => {
          authListener?.subscription?.unsubscribe();
        };
      } catch (error) {
        console.warn('Auth listener failed:', error);
      }
    };

    const cleanup = initializeAuthListener();
    return () => {
      cleanup?.then(unsubscribe => unsubscribe && unsubscribe());
    };
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setError(null);
  };

  const handleLogout = async () => {
    try {
      await realApiService.logout();
      setIsAuthenticated(false);
    } catch (error) {
      console.warn('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="App">
      {error && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      {isAuthenticated ? (
        <Layout onLogout={handleLogout} />
      ) : (
        <Auth onAuthSuccess={handleAuthSuccess} />
      )}
    </div>
  );
}

export default App;
