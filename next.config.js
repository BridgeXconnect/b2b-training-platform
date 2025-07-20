/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Allow builds to continue with TypeScript errors during development
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  eslint: {
    // Allow builds to continue with ESLint errors during development
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },
};

module.exports = nextConfig;