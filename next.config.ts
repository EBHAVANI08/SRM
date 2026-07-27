import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  // TypeScript errors must not be silently skipped in production builds
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow eslint warnings but do not fail the build from lint-only issues
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: true,
  experimental: {
    turbopack: {
      root: path.resolve(__dirname),
    },
  },
};

export default nextConfig;
