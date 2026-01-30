/**
 * 生成簡單的測試封面圖片
 * 執行: node scripts/generate-cover.js
 */
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { deflateSync } from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const imagesDir = join(__dirname, '../public/images');

if (!existsSync(imagesDir)) {
  mkdirSync(imagesDir, { recursive: true });
}

// CRC32 計算
function crc32(data) {
  let crc = 0xFFFFFFFF;
  const table = new Uint32Array(256);

  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }

  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }

  return (crc ^ 0xFFFFFFFF) >>> 0;
}

/**
 * 建立漸層 PNG 封面
 */
function createGradientPNG(width, height) {
  // PNG 簽名
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR chunk
  const ihdr = Buffer.alloc(25);
  ihdr.writeUInt32BE(13, 0);
  ihdr.write('IHDR', 4);
  ihdr.writeUInt32BE(width, 8);
  ihdr.writeUInt32BE(height, 12);
  ihdr.writeUInt8(8, 16);  // 位元深度
  ihdr.writeUInt8(2, 17);  // RGB
  ihdr.writeUInt8(0, 18);
  ihdr.writeUInt8(0, 19);
  ihdr.writeUInt8(0, 20);
  ihdr.writeUInt32BE(crc32(ihdr.slice(4, 21)), 21);

  // 建立漸層圖像資料
  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowStart = y * rowSize;
    rawData[rowStart] = 0; // 無濾鏡

    for (let x = 0; x < width; x++) {
      const pixelStart = rowStart + 1 + x * 3;

      // 深藍到黑色漸層
      const t = y / height;
      const r = Math.floor(10 * (1 - t));
      const g = Math.floor(20 * (1 - t));
      const b = Math.floor(40 + 20 * (1 - t));

      rawData[pixelStart] = r;
      rawData[pixelStart + 1] = g;
      rawData[pixelStart + 2] = b;
    }
  }

  const compressed = deflateSync(rawData);

  // IDAT chunk
  const idat = Buffer.alloc(12 + compressed.length);
  idat.writeUInt32BE(compressed.length, 0);
  idat.write('IDAT', 4);
  compressed.copy(idat, 8);
  idat.writeUInt32BE(crc32(Buffer.concat([Buffer.from('IDAT'), compressed])), 8 + compressed.length);

  // IEND chunk
  const iend = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82]);

  return Buffer.concat([signature, ihdr, idat, iend]);
}

try {
  console.log('Generating cover image...');
  const cover = createGradientPNG(1920, 1080);
  writeFileSync(join(imagesDir, 'bg_start_cover.png'), cover);
  console.log('Created bg_start_cover.png (1920x1080)');
  console.log('Done!');
} catch (error) {
  console.error('Error:', error.message);
}
