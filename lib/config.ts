// Supabase Configuration
export const SUPABASE_CONFIG = {
  url: 'https://uspkxofsscqdptevvand.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzcGt4b2Zzc2NxZHB0ZXZ2YW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNTcwOTgsImV4cCI6MjA3MDgzMzA5OH0.enz-02-1iilnUU3YGj10VXdRYvWU0aFYX14zp9KVteI',
}

// Use environment variables if available, otherwise use hardcoded values
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_CONFIG.url
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_CONFIG.anonKey
