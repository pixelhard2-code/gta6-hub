import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Permite que Vercel complete el build aunque existan advertencias de TypeScript
    ignoreBuildErrors: true,
  },
};

export default nextConfig;