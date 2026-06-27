/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.resolve.alias = { ...(config.resolve.alias ?? {}), canvas: 'canvas' }
    return config
  },
}

export default nextConfig
