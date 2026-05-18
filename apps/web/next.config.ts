import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@reprod/shared', '@reprod/sdk'],
}

export default nextConfig
