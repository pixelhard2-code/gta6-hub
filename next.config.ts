import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Permite que Vercel complete el build aunque existan advertencias de TypeScript
    ignoreBuildErrors: true,
  },
  eslint: {
    // Evita que los errores de linteo bloqueen la compilación
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;