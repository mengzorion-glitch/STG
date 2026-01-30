/**
 * 生成視差背景圖片
 * 執行: node scripts/generate-backgrounds.js
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
 * 建立 PNG
 */
function createPNG(width, height, pixelFunc) {
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  const ihdr = Buffer.alloc(25);
  ihdr.writeUInt32BE(13, 0);
  ihdr.write('IHDR', 4);
  ihdr.writeUInt32BE(width, 8);
  ihdr.writeUInt32BE(height, 12);
  ihdr.writeUInt8(8, 16);
  ihdr.writeUInt8(2, 17);
  ihdr.writeUInt8(0, 18);
  ihdr.writeUInt8(0, 19);
  ihdr.writeUInt8(0, 20);
  ihdr.writeUInt32BE(crc32(ihdr.slice(4, 21)), 21);

  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowStart = y * rowSize;
    rawData[rowStart] = 0;
    for (let x = 0; x < width; x++) {
      const pixelStart = rowStart + 1 + x * 3;
      const { r, g, b } = pixelFunc(x, y, width, height);
      rawData[pixelStart] = r;
      rawData[pixelStart + 1] = g;
      rawData[pixelStart + 2] = b;
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

// 簡單的偽隨機數生成器 (可重複)
function seededRandom(seed) {
  return function() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

try {
  console.log('Generating background images...');

  // 遠景 (深色星空)
  const bgFar = createPNG(2560, 1080, (x, y, w, h) => {
    const random = seededRandom(x * 1000 + y);
    const t = y / h;

    // 基底深藍色漸層
    let r = Math.floor(5 + 10 * (1 - t));
    let g = Math.floor(8 + 15 * (1 - t));
    let b = Math.floor(20 + 30 * (1 - t));

    // 添加星星
    if (random() > 0.998) {
      const brightness = 150 + Math.floor(random() * 105);
      r = brightness;
      g = brightness;
      b = brightness;
    }

    return { r, g, b };
  });
  writeFileSync(join(imagesDir, 'bg_far.png'), bgFar);
  console.log('Created bg_far.png (2560x1080) - 遠景星空');

  // 中景 (山脈剪影)
  const bgMid = createPNG(2560, 1080, (x, y, w, h) => {
    const random = seededRandom(x);

    // 生成山脈高度 (使用簡單的正弦波組合)
    const mountain1 = Math.sin(x * 0.003) * 150 + Math.sin(x * 0.007) * 80;
    const mountain2 = Math.sin(x * 0.005 + 1) * 120 + Math.sin(x * 0.011) * 60;
    const mountainHeight = h - 300 + Math.max(mountain1, mountain2);

    if (y > mountainHeight) {
      // 山脈部分 - 深色剪影
      const depth = (y - mountainHeight) / (h - mountainHeight);
      const r = Math.floor(15 + depth * 10);
      const g = Math.floor(20 + depth * 15);
      const b = Math.floor(35 + depth * 20);
      return { r, g, b };
    } else {
      // 透明部分 (用深色表示，實際遊戲中會疊加在遠景上)
      return { r: 8, g: 12, b: 25 };
    }
  });
  writeFileSync(join(imagesDir, 'bg_mid.png'), bgMid);
  console.log('Created bg_mid.png (2560x1080) - 中景山脈');

  console.log('Done!');
} catch (error) {
  console.error('Error:', error.message);
}
