// Static export has no image optimizer, so map Next's requested width to
// the nearest pre-sized variant from scripts/optimize-images.mjs.
const VARIANTS: Record<string, { name: string; widths: number[] }> = {
  "/pfp.webp": { name: "pfp", widths: [320, 640] },
  "/projectX.webp": { name: "projectX", widths: [640, 1080] },
  "/project1.0x.webp": { name: "project1.0x", widths: [640, 1080] },
};

export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }) {
  const v = VARIANTS[src];
  if (!v) return src;
  const w = v.widths.find((x) => x >= width) ?? v.widths[v.widths.length - 1];
  return `/img/${v.name}-${w}.webp`;
}
