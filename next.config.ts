import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  swcMinify: true,
  typescript: {
    // 开发模式下忽略 TypeScript 错误，便于开发期间调试
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  eslint: {
    // 开发模式下忽略 ESLint 错误，便于开发期间调试
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  }
};

export default nextConfig;
