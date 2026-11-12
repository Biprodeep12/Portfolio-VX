import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
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
    // One page, ~30 KB of CSS: inlining it removes the render-blocking request.
    inlineCss: true,
  },
};

export default nextConfig;
