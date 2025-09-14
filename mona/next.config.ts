import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  eslint: {
    // Do not block Vercel builds on ESLint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Do not block Vercel builds on type errors
    ignoreBuildErrors: true,
  },
  turbopack: {
    // Explicitly set the workspace root to the mona folder
    root: path.join(__dirname),
  },
};

export default nextConfig;
