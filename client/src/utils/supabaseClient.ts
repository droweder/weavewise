import { createClient } from '@supabase/supabase-js'

// Usar variáveis de ambiente com fallback para os valores corretos
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qppfutmnmufjynsmmdxb.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwcGZ1dG1ubXVmanluc21tZHhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NjA5NzgsImV4cCI6MjA3MDQzNjk3OH0.BKgm-ak2rlZKvOmiSXIq7058y9QrIy5VDjWwkzrAUdE'

// Validar que as variáveis existem
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Erro crítico: Configuração do Supabase inválida!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: {
      getItem: (key) => {
        try {
          return localStorage.getItem(key);
        } catch (error) {
          console.error('Erro ao obter item do localStorage:', error);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.error('Erro ao salvar item no localStorage:', error);
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error('Erro ao remover item do localStorage:', error);
        }
      }
    }
  }
})
