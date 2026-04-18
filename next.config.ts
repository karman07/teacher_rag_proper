import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ["@heroui/react", "@heroui/theme"],
};

export default nextConfig;
