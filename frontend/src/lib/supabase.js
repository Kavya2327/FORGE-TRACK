import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ijfzltsxlusadjwjozva.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqZnpsdHN4bHVzYWRqd2pvenZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NzQ1MDcsImV4cCI6MjA5MzA1MDUwN30.LG4w7Pina-BMmBz6-lA_mzK35FbWEeyXr-ic2G5i0JI'

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
    lock_acquire_timeout: 5000, // Increased to allow more time during slow dev starts
  }
})
