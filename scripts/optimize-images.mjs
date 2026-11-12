// Pre-sizes images for the static export (Next's image optimizer is off in
// `output: "export"`). Run: node scripts/optimize-images.mjs
import sharp from "sharp";

const JOBS = [
  { src: "public/pfp.webp", name: "pfp", widths: [320, 640], quality: 72 },
  { src: "public/projectX.webp", name: "projectX", widths: [640, 828, 1080], quality: 70 },
  { src: "public/project1.0x.webp", name: "project1.0x", widths: [640, 828, 1080], quality: 70 },
];

for (const job of JOBS) {
  for (const w of job.widths) {
    const out = `public/img/${job.name}-${w}.webp`;
    const info = await sharp(job.src).resize({ width: w, withoutEnlargement: true }).webp({ quality: job.quality, effort: 6 }).toFile(out);
    console.log(out, `${info.width}x${info.height}`, `${(info.size / 1024).toFixed(1)} KB`);
  }
}
