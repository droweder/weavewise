import React, { useState, useEffect } from 'react';
import { Auth } from './components/Auth';
import { Layout } from './components/Layout';
import { realApiService } from './services/realApiService';
import { ThemeProvider } from './components/ThemeProvider';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se o usuário já está autenticado
    const checkAuthStatus = async () => {
      try {
        // Primeiro, tentar recuperar a sessão existente
        const { data: { session } } = await realApiService.supabase.auth.getSession();
        
        if (session) {
          setIsAuthenticated(true);
        } else {
          const authenticated = await realApiService.isAuthenticated();
          setIsAuthenticated(authenticated);
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
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
            console.log('Auth state changed:', event, session);
            setIsAuthenticated(!!session?.user);
          }
        );

        // Cleanup listener
        return () => {
          authListener.subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Erro ao inicializar listener de autenticação:', error);
      }
    };

    const cleanup = initializeAuthListener();
    return () => {
      cleanup?.then(unsubscribe => unsubscribe && unsubscribe());
    };
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await realApiService.logout();
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
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
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="App">
        {isAuthenticated ? (
          <Layout onLogout={handleLogout} />
        ) : (
          <Auth onAuthSuccess={handleAuthSuccess} />
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
