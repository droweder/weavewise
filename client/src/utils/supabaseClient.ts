import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase com valores fixos
const supabaseUrl = 'https://qppfutmnmufjynsmmdxb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwcGZ1dG1ubXVmanluc21tZHhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MzY4MDUsImV4cCI6MjA2OTIxMjgwNX0.EcsaPDzmHnSMx_sV8Q_NczLJROpwKd-OqLDEwwMFuXE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
