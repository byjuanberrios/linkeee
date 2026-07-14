/** @type {import('next').NextConfig} */
const nextConfig = {
  // standalone solo cuando Docker lo pide (production build en contenedor)
  output: process.env.NEXT_OUTPUT_STANDALONE === "true" ? "standalone" : undefined,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig