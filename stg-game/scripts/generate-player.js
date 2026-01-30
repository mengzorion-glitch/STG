/**
 * 生成玩家角色圖片
 * 執行: node scripts/generate-player.js
 */
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { deflateSync } from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const playerDir = join(__dirname, '../public/player');

if (!existsSync(playerDir)) {
  mkdirSync(playerDir, { recursive: true });
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

// 繪製飛機形狀
function drawShip(x, y, w, h, baseColor, frame = 0) {
  const cx = w / 2;
  const cy = h / 2;

  // 相對座標
  const rx = (x - cx) / (w / 2);
  const ry = (y - cy) / (h / 2);

  // 飛機形狀 (三角形機身)
  const bodyWidth = 0.3;
  const noseLength = 0.8;

  // 機身
  if (rx > -0.2 && rx < noseLength) {
    const bodyY = bodyWidth * (1 - rx / noseLength);
    if (Math.abs(ry) < bodyY) {
      // 添加動畫效果 (輕微顏色變化)
      const colorOffset = Math.sin(frame * 0.5) * 20;
      return {
        r: Math.min(255, baseColor.r + colorOffset),
        g: Math.min(255, baseColor.g + colorOffset),
        b: baseColor.b,
        a: 255
      };
    }
  }

  // 機翼
  if (rx > -0.3 && rx < 0.2) {
    const wingY = 0.6 - Math.abs(rx) * 0.5;
    if (Math.abs(ry) > 0.2 && Math.abs(ry) < wingY) {
      return { r: baseColor.r - 30, g: baseColor.g - 30, b: baseColor.b - 30, a: 255 };
    }
  }

  // 引擎光 (尾部)
  if (rx < -0.2 && rx > -0.5) {
    const engineY = 0.15;
    if (Math.abs(ry) < engineY) {
      const intensity = 1 - (rx + 0.5) / 0.3;
      return {
        r: 255,
        g: Math.floor(200 * intensity),
        b: Math.floor(100 * intensity),
        a: Math.floor(255 * intensity)
      };
    }
  }

  return { r: 0, g: 0, b: 0, a: 0 };
}

try {
  console.log('Generating player sprites...');
  const size = 128;

  // 基礎顏色
  const idleColor = { r: 100, g: 180, b: 255 };    // 淡藍色
  const attackColor = { r: 150, g: 200, b: 255 };  // 亮藍色
  const hurtColor = { r: 255, g: 100, b: 100 };    // 紅色

  // idle 動畫 (3幀)
  for (let frame = 0; frame < 3; frame++) {
    const png = createPNG(size, size, (x, y, w, h) =>
      drawShip(x, y, w, h, idleColor, frame)
    );
    writeFileSync(join(playerDir, `player_idle_${frame}.png`), png);
  }
  console.log('Created player_idle_0~2.png');

  // attack 動畫 (2幀)
  for (let frame = 0; frame < 2; frame++) {
    const png = createPNG(size, size, (x, y, w, h) =>
      drawShip(x, y, w, h, attackColor, frame * 2)
    );
    writeFileSync(join(playerDir, `player_attack_${frame}.png`), png);
  }
  console.log('Created player_attack_0~1.png');

  // hurt 動畫 (1幀)
  const hurtPng = createPNG(size, size, (x, y, w, h) =>
    drawShip(x, y, w, h, hurtColor, 0)
  );
  writeFileSync(join(playerDir, 'player_hurt_0.png'), hurtPng);
  console.log('Created player_hurt_0.png');

  console.log('Done!');
} catch (error) {
  console.error('Error:', error.message);
}
