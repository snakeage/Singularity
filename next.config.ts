import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Next 16 blocks cross-origin /_next/* in dev; 127.0.0.1 ≠ localhost.
  // Without this, hydration can hang and the UI stays on «Загрузка…».
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
