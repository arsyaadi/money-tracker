import sharp from "sharp";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const sizes = [
  { name: "icon-192x192.png", size: 192 },
  { name: "icon-512x512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
];

const svgPath = join(process.cwd(), "public", "icon.svg");
const svgBuffer = readFileSync(svgPath);

async function generateIcons() {
  for (const { name, size } of sizes) {
    const outputPath = join(process.cwd(), "public", name);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`Generated ${name}`);
  }
  console.log("All icons generated!");
}

generateIcons().catch(console.error);