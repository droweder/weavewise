import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qppfutmnmufjynsmmdxb.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwcGZ1dG1ubXVmanluc21tZHhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MzY4MDUsImV4cCI6MjA2OTIxMjgwNX0.EcsaPDzmHnSMx_sV8Q_NczLJROpwKd-OqLDEwwMFuXE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
