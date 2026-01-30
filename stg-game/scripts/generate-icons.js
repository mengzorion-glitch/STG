/**
 * 生成簡單的 PWA 測試圖示
 * 執行: node scripts/generate-icons.js
 *
 * 這會生成簡單的純色圖示用於測試
 * 正式發布時請替換為設計好的圖示
 */
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { deflateSync } from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '../public/icons');

if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
}

/**
 * 建立簡單的 PNG 檔案 (純色方塊)
 * 使用最小化的 PNG 格式
 */
function createSimplePNG(size, color) {
  // PNG 簽名
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR chunk
  const ihdr = Buffer.alloc(25);
  ihdr.writeUInt32BE(13, 0); // 長度
  ihdr.write('IHDR', 4);
  ihdr.writeUInt32BE(size, 8); // 寬度
  ihdr.writeUInt32BE(size, 12); // 高度
  ihdr.writeUInt8(8, 16); // 位元深度
  ihdr.writeUInt8(2, 17); // 色彩類型 (RGB)
  ihdr.writeUInt8(0, 18); // 壓縮方法
  ihdr.writeUInt8(0, 19); // 濾鏡方法
  ihdr.writeUInt8(0, 20); // 交錯方法
  ihdr.writeUInt32BE(crc32(ihdr.slice(4, 21)), 21);

  // 建立圖像資料 (無壓縮)
  const rowSize = 1 + size * 3; // 濾鏡位元組 + RGB
  const rawData = Buffer.alloc(rowSize * size);

  for (let y = 0; y < size; y++) {
    const rowStart = y * rowSize;
    rawData[rowStart] = 0; // 無濾鏡
    for (let x = 0; x < size; x++) {
      const pixelStart = rowStart + 1 + x * 3;
      rawData[pixelStart] = color.r;
      rawData[pixelStart + 1] = color.g;
      rawData[pixelStart + 2] = color.b;
    }
  }

  // 使用 zlib 壓縮
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

// 生成圖示
const color = { r: 0x33, g: 0x99, b: 0xFF }; // 藍色

try {
  console.log('Generating PWA icons...');

  const png192 = createSimplePNG(192, color);
  writeFileSync(join(iconsDir, 'icon_192.png'), png192);
  console.log('Created icon_192.png');

  const png512 = createSimplePNG(512, color);
  writeFileSync(join(iconsDir, 'icon_512.png'), png512);
  console.log('Created icon_512.png');

  console.log('Done! Icons created in public/icons/');
} catch (error) {
  console.error('Error:', error.message);
  console.log('Please create icons manually.');
}
