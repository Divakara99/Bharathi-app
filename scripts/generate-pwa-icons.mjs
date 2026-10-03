import { readFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";

// Sharp ships with Next.js; this is a build-time asset utility, not browser code.
const require = createRequire(import.meta.url);
const sharp = require("sharp");
const svg = await readFile(new URL("../public/icons/app.svg", import.meta.url));
const directory = new URL("../public/icons/", import.meta.url);
await mkdir(directory, { recursive: true });
for (const [filename, size] of [
  ["app-192.png", 192], ["app-512.png", 512],
  ["app-maskable-512.png", 512], ["apple-touch-icon.png", 180],
]) {
  await sharp(svg).resize(size, size).png().toFile(new URL(filename, directory).pathname);
  console.log(`Created ${filename}: ${size}×${size}`);
}
