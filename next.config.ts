import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Add empty turbopack config to silence the webpack/turbopack warning
  turbopack: {},
};

export default nextConfig;
