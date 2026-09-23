import sharp from "sharp";
import { mkdirSync } from "node:fs";

mkdirSync("public/icons", { recursive: true });

const svg = "public/icon.svg";
const sizes = [
  { file: "public/icons/icon-192.png", size: 192 },
  { file: "public/icons/icon-512.png", size: 512 },
  { file: "public/icons/maskable-512.png", size: 512, padding: 0.14 },
  { file: "public/apple-touch-icon.png", size: 180 },
];

for (const { file, size, padding } of sizes) {
  if (padding) {
    const inner = Math.round(size * (1 - padding * 2));
    await sharp({
      create: { width: size, height: size, channels: 4, background: "#F0EAD8" },
    })
      .composite([{ input: await sharp(svg).resize(inner, inner).toBuffer(), gravity: "center" }])
      .png()
      .toFile(file);
  } else {
    await sharp(svg).resize(size, size).png().toFile(file);
  }
  console.log("wrote", file);
}
