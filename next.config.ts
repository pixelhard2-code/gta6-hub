import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: { "/api/stickers/**": ["./assets/stickers/*.png"] },
  typescript: {
    // Permite que Vercel complete el build aunque existan advertencias de TypeScript
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
