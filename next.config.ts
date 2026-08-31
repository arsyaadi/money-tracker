import type { NextConfig } from "next";

const isTauri = process.env.TAURI_ENV_PLATFORM !== undefined || process.env.IS_TAURI === "true";

const nextConfig: NextConfig = {
  ...(isTauri
    ? {
        output: "export",
        images: {
          unoptimized: true,
        },
      }
    : {}),
};

export default nextConfig;