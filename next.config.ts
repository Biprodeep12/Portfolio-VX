import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
