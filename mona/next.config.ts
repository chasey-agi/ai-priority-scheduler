import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Do not block Vercel builds on ESLint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Do not block Vercel builds on type errors
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
