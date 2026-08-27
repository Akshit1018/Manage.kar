/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  distDir: process.env.NEXT_DIST_DIR || ".next",
}

export default nextConfig
