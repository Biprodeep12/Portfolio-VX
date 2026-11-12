import type { NextConfig } from "next";

// Frozen at build time so "deployed" dates don't drift when ISR re-renders pages.
const BUILD_TIME = new Date().toISOString();
const BUILD_SHA = (process.env.VERCEL_GIT_COMMIT_SHA ?? "").slice(0, 7);

const nextConfig: NextConfig = {
  env: { BUILD_TIME, BUILD_SHA },
  trailingSlash: true,
  reactCompiler: true,
  reactStrictMode: true,
  images: {
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    deviceSizes: [640, 828, 1080],
    imageSizes: [320],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
    // Inlined CSS paints ~0.9 s sooner on slow mobile than a separate file.
    inlineCss: true,
  },
};

export default nextConfig;
