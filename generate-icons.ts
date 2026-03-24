// generate-icons.ts - Generates solid-color circle PNG icons using Node.js built-ins
// Run: node --strip-types generate-icons.ts

import { deflateSync } from "node:zlib";
import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

type RGB = [number, number, number];

function crc32(buf: Buffer): number {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcVal = Buffer.alloc(4);
  crcVal.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcVal]);
}

function createPNG(size: number, r: number, g: number, b: number): Buffer {
  const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // RGBA

  const center = size / 2;
  const radius = size / 2 - 1;

  const rawData = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    const rowOffset = y * (1 + size * 4);
    rawData[rowOffset] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - center;
      const dy = y + 0.5 - center;
      const inCircle = Math.sqrt(dx * dx + dy * dy) <= radius;
      const pixOffset = rowOffset + 1 + x * 4;
      rawData[pixOffset + 0] = inCircle ? r : 0;
      rawData[pixOffset + 1] = inCircle ? g : 0;
      rawData[pixOffset + 2] = inCircle ? b : 0;
      rawData[pixOffset + 3] = inCircle ? 255 : 0;
    }
  }

  const compressed = deflateSync(rawData);
  return Buffer.concat([
    PNG_SIG,
    makeChunk("IHDR", ihdrData),
    makeChunk("IDAT", compressed),
    makeChunk("IEND", Buffer.alloc(0)),
  ]);
}

const COLORS: Record<string, RGB> = {
  success: [34, 197, 94], // green-500  #22c55e
  failure: [239, 68, 68], // red-500    #ef4444
  warning: [249, 115, 22], // orange-500 #f97316
  pending: [234, 179, 8], // yellow-500 #eab308
  default: [107, 114, 128], // gray-500   #6b7280
};

const iconsDir = join(__dirname, "icons");
if (!existsSync(iconsDir)) mkdirSync(iconsDir);

for (const [name, [r, g, b]] of Object.entries(COLORS)) {
  for (const size of [16, 48, 128]) {
    const suffix = name === "default" ? "" : `-${name}`;
    const outPath = join(iconsDir, `icon${size}${suffix}.png`);
    writeFileSync(outPath, createPNG(size, r, g, b));
    console.log(`Created ${outPath}`);
  }
}
