import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Add empty turbopack config to silence the webpack/turbopack warning
  turbopack: {},
};

export default nextConfig;
