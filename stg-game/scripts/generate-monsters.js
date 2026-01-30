/**
 * 生成怪物圖片
 * 執行: node scripts/generate-monsters.js
 */
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { deflateSync } from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const monsterDir = join(__dirname, '../public/monster');

if (!existsSync(monsterDir)) {
  mkdirSync(monsterDir, { recursive: true });
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
 * 建立 PNG (RGBA)
 */
function createPNG(width, height, pixelFunc) {
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  const ihdr = Buffer.alloc(25);
  ihdr.writeUInt32BE(13, 0);
  ihdr.write('IHDR', 4);
  ihdr.writeUInt32BE(width, 8);
  ihdr.writeUInt32BE(height, 12);
  ihdr.writeUInt8(8, 16);
  ihdr.writeUInt8(6, 17);  // RGBA
  ihdr.writeUInt8(0, 18);
  ihdr.writeUInt8(0, 19);
  ihdr.writeUInt8(0, 20);
  ihdr.writeUInt32BE(crc32(ihdr.slice(4, 21)), 21);

  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowStart = y * rowSize;
    rawData[rowStart] = 0;
    for (let x = 0; x < width; x++) {
      const pixelStart = rowStart + 1 + x * 4;
      const { r, g, b, a } = pixelFunc(x, y, width, height);
      rawData[pixelStart] = r;
      rawData[pixelStart + 1] = g;
      rawData[pixelStart + 2] = b;
      rawData[pixelStart + 3] = a;
    }
  }

  const compressed = deflateSync(rawData);

  const idat = Buffer.alloc(12 + compressed.length);
  idat.writeUInt32BE(compressed.length, 0);
  idat.write('IDAT', 4);
  compressed.copy(idat, 8);
  idat.writeUInt32BE(crc32(Buffer.concat([Buffer.from('IDAT'), compressed])), 8 + compressed.length);

  const iend = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82]);

  return Buffer.concat([signature, ihdr, idat, iend]);
}

/**
 * 繪製小型怪物 (圓形敵機)
 */
function drawSmallMonster(x, y, w, h, color) {
  const cx = w / 2;
  const cy = h / 2;
  const radius = w * 0.35;

  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // 主體圓形
  if (dist < radius) {
    // 內圈高光
    if (dist < radius * 0.5) {
      return {
        r: Math.min(255, color.r + 40),
        g: Math.min(255, color.g + 40),
        b: Math.min(255, color.b + 40),
        a: 255
      };
    }
    return { r: color.r, g: color.g, b: color.b, a: 255 };
  }

  // 外圈光暈
  if (dist < radius * 1.2) {
    const alpha = Math.floor(255 * (1 - (dist - radius) / (radius * 0.2)));
    return { r: color.r, g: color.g, b: color.b, a: alpha };
  }

  return { r: 0, g: 0, b: 0, a: 0 };
}

/**
 * 繪製中型怪物 (六邊形敵機)
 */
function drawMediumMonster(x, y, w, h, color) {
  const cx = w / 2;
  const cy = h / 2;
  const size = w * 0.4;

  const dx = x - cx;
  const dy = y - cy;

  // 六邊形判定
  const angle = Math.atan2(dy, dx);
  const dist = Math.sqrt(dx * dx + dy * dy);

  // 六邊形邊界
  const sides = 6;
  const angleOffset = Math.PI / 6;
  const sectorAngle = (Math.PI * 2) / sides;
  const sector = Math.floor((angle + angleOffset + Math.PI) / sectorAngle);
  const sectorMidAngle = sector * sectorAngle - angleOffset;
  const hexRadius = size / Math.cos((angle + Math.PI) % sectorAngle - sectorAngle / 2);

  if (dist < size * 0.9) {
    // 核心區域
    if (dist < size * 0.3) {
      return {
        r: Math.min(255, color.r + 60),
        g: Math.min(255, color.g + 60),
        b: color.b,
        a: 255
      };
    }
    return { r: color.r, g: color.g, b: color.b, a: 255 };
  }

  // 邊緣
  if (dist < size * 1.1) {
    return {
      r: Math.max(0, color.r - 40),
      g: Math.max(0, color.g - 40),
      b: Math.max(0, color.b - 40),
      a: 255
    };
  }

  return { r: 0, g: 0, b: 0, a: 0 };
}

try {
  console.log('Generating monster sprites...');

  // 小型怪物 - 紅色
  const smallColor = { r: 255, g: 80, b: 80 };
  const smallPng = createPNG(64, 64, (x, y, w, h) =>
    drawSmallMonster(x, y, w, h, smallColor)
  );
  writeFileSync(join(monsterDir, 'mob_small_0.png'), smallPng);
  console.log('Created mob_small_0.png');

  // 中型怪物 - 紫色
  const mediumColor = { r: 180, g: 80, b: 220 };
  const mediumPng = createPNG(128, 128, (x, y, w, h) =>
    drawMediumMonster(x, y, w, h, mediumColor)
  );
  writeFileSync(join(monsterDir, 'mob_medium_0.png'), mediumPng);
  console.log('Created mob_medium_0.png');

  console.log('Done!');
} catch (error) {
  console.error('Error:', error.message);
}
