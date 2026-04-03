import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disabilitato temporaneamente per diagnosticare errori di build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
