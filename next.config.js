/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure for Netlify deployment
  images: {
    unoptimized: true,
    domains: ['localhost', 'supabase.co'],
  },
  // Disable experimental features for stability
  experimental: {
    // Remove all experimental features
  },
  // Disable static optimization completely
  staticPageGenerationTimeout: 0,
  // Force all pages to be dynamic
  generateStaticParams: false,
}

module.exports = nextConfig
