// Renders public/icon.svg into the PNG/ICO sizes browsers and home screens ask for.
// Run: node scripts/make-icons.mjs
import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";

const svg = readFileSync("public/icon.svg");
const png = (size) => sharp(svg, { density: 72 * (size / 32) * 2 }).resize(size, size).png().toBuffer();

for (const [file, size] of [
  ["public/favicon-16x16.png", 16],
  ["public/favicon-32x32.png", 32],
  ["public/apple-touch-icon.png", 180],
  ["public/android-chrome-192x192.png", 192],
  ["public/android-chrome-512x512.png", 512],
]) {
  writeFileSync(file, await png(size));
  console.log(file);
}

// favicon.ico with an embedded 32px PNG (supported by every current browser).
const p32 = await png(32);
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
header.writeUInt8(32, 6); header.writeUInt8(32, 7); header.writeUInt8(0, 8); header.writeUInt8(0, 9);
header.writeUInt16LE(1, 10); header.writeUInt16LE(32, 12);
header.writeUInt32LE(p32.length, 14); header.writeUInt32LE(22, 18);
writeFileSync("public/favicon.ico", Buffer.concat([header, p32]));
console.log("public/favicon.ico");
