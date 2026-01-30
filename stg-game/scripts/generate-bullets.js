/**
 * 生成子彈圖片
 * 執行: node scripts/generate-bullets.js
 */
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { deflateSync } from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const playerDir = join(__dirname, '../public/player');
const monsterDir = join(__dirname, '../public/monster');

if (!existsSync(playerDir)) mkdirSync(playerDir, { recursive: true });
if (!existsSync(monsterDir)) mkdirSync(monsterDir, { recursive: true });

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
  ihdr.writeUInt8(6, 17);
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
 * 繪製玩家子彈 (水平橢圓形光彈)
 */
function drawPlayerBullet(x, y, w, h, color, frame) {
  const cx = w / 2;
  const cy = h / 2;

  // 橢圓形 (水平較長)
  const rx = w * 0.4;
  const ry = h * 0.25;

  const dx = (x - cx) / rx;
  const dy = (y - cy) / ry;
  const dist = dx * dx + dy * dy;

  if (dist < 1) {
    // 核心高光
    if (dist < 0.3) {
      return { r: 255, g: 255, b: 255, a: 255 };
    }
    // 動畫閃爍效果
    const flicker = frame === 0 ? 0 : 20;
    return {
      r: Math.min(255, color.r + flicker),
      g: Math.min(255, color.g + flicker),
      b: color.b,
      a: 255
    };
  }

  // 外圈光暈
  if (dist < 1.5) {
    const alpha = Math.floor(255 * (1 - (dist - 1) / 0.5));
    return { r: color.r, g: color.g, b: color.b, a: alpha };
  }

  return { r: 0, g: 0, b: 0, a: 0 };
}

/**
 * 繪製怪物子彈 (圓形紅色彈)
 */
function drawMobBullet(x, y, w, h, color) {
  const cx = w / 2;
  const cy = h / 2;
  const radius = w * 0.35;

  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < radius * 0.5) {
    // 核心高光
    return { r: 255, g: 200, b: 200, a: 255 };
  }

  if (dist < radius) {
    return { r: color.r, g: color.g, b: color.b, a: 255 };
  }

  // 外圈光暈
  if (dist < radius * 1.3) {
    const alpha = Math.floor(200 * (1 - (dist - radius) / (radius * 0.3)));
    return { r: color.r, g: color.g, b: color.b, a: alpha };
  }

  return { r: 0, g: 0, b: 0, a: 0 };
}

try {
  console.log('Generating bullet sprites...');

  // 玩家子彈 - 藍色光彈 (2幀動畫)
  const playerColor = { r: 100, g: 200, b: 255 };
  for (let frame = 0; frame < 2; frame++) {
    const png = createPNG(32, 16, (x, y, w, h) =>
      drawPlayerBullet(x, y, w, h, playerColor, frame)
    );
    writeFileSync(join(playerDir, `player_bullet_${frame}.png`), png);
  }
  console.log('Created player_bullet_0~1.png');

  // 怪物子彈 - 紅色圓彈
  const mobColor = { r: 255, g: 80, b: 120 };
  const mobPng = createPNG(24, 24, (x, y, w, h) =>
    drawMobBullet(x, y, w, h, mobColor)
  );
  writeFileSync(join(monsterDir, 'mob_bullet_0.png'), mobPng);
  console.log('Created mob_bullet_0.png');

  console.log('Done!');
} catch (error) {
  console.error('Error:', error.message);
}
