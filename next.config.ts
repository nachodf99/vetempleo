import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CV en PDF hasta 4 MB (Vercel admite 4,5 MB por petición)
  experimental: { serverActions: { bodySizeLimit: "4.2mb" } },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
