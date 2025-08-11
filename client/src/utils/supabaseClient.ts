import { createClient } from '@supabase/supabase-js'

// Usar variáveis de ambiente se disponíveis, senão usar valores fixos
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qppfutmnmufjynsmmdxb.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwcGZ1dG1ubXVmanluc21tZHhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MzY4MDUsImV4cCI6MjA2OTIxMjgwNX0.EcsaPDzmHnSMx_sV8Q_NczLJROpwKd-OqLDEwwMFuXE'

// Log para debug
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key (primeiros 20 chars):', supabaseAnonKey.substring(0, 20) + '...');

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
