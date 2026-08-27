import sharp from "sharp";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const publicSizes = [
  { name: "icon-192x192.png", size: 192 },
  { name: "icon-512x512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "logo.png", size: 128 },
  { name: "favicon.png", size: 32 },
];

const tauriSizes = [
  { name: "32x32.png", size: 32 },
  { name: "128x128.png", size: 128 },
  { name: "128x128@2x.png", size: 256 },
  { name: "icon.png", size: 512 },
];

const svgPath = join(process.cwd(), "public", "icon.svg");
const svgBuffer = readFileSync(svgPath);

async function generateIcons() {
  for (const { name, size } of publicSizes) {
    const outputPath = join(process.cwd(), "public", name);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`Generated public/${name}`);
  }

  const tauriDir = join(process.cwd(), "src-tauri", "icons");
  if (existsSync(tauriDir)) {
    for (const { name, size } of tauriSizes) {
      const outputPath = join(tauriDir, name);
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      console.log(`Generated src-tauri/icons/${name}`);
    }
  }
  console.log("All monochrome icons generated successfully!");
}

generateIcons().catch(console.error);