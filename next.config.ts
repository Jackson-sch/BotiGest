import type { NextConfig } from "next";

const tunnelOrigins = [
  "*.tunnelmole.net",
  "**.tunnelmole.net",
  "tunnelmole.net",
  "*.tunnelmole.com",
  "**.tunnelmole.com",
  "tunnelmole.com",
  "*.localtunnel.me",
  "**.localtunnel.me",
  "*.ngrok-free.app",
  "**.ngrok-free.app",
  "*.trycloudflare.com",
  "**.trycloudflare.com",
  "localhost:3000",
  "127.0.0.1:3000",
];

const nextConfig: NextConfig = {
  // Permite que Turbopack y Next.js sirvan HMR y assets a través de túneles
  allowedDevOrigins: tunnelOrigins,
  experimental: {
    agentFeedback: true,
    // Permite que los Server Actions (Login, Ventas, Perfil, etc.) se invoquen de forma segura a través del túnel
    serverActions: {
      allowedOrigins: tunnelOrigins,
    },
  },
  cacheComponents: true,
  partialPrefetching: true,
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
