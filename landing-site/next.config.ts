import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Landing site configuration
  trailingSlash: true,
  // Ensure external links work properly
  async redirects() {
    return []
  },
}

export default nextConfig
