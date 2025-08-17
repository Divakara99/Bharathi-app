/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure for Netlify deployment
  images: {
    unoptimized: true,
    domains: ['localhost', 'supabase.co'],
  },
  // Add environment variables directly
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://uspkxofsscqdptevvand.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzcGt4b2Zzc2NxZHB0ZXZ2YW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNTcwOTgsImV4cCI6MjA3MDgzMzA5OH0.enz-02-1iilnUU3YGj10VXdRYvWU0aFYX14zp9KVteI',
  },
}

module.exports = nextConfig
