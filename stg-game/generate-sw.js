import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

// 讀取版本號
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const VERSION = pkg.version;

// 遞迴取得所有檔案
function getAllFiles(dir, baseDir = dir) {
  let files = [];
  try {
    for (const file of readdirSync(dir)) {
      const filePath = join(dir, file);
      if (statSync(filePath).isDirectory()) {
        files = files.concat(getAllFiles(filePath, baseDir));
      } else {
        // 使用 path.relative 計算相對路徑，並統一轉為 POSIX 格式
        const relativePath = relative(baseDir, filePath).replace(/\\/g, '/');
        files.push('./' + relativePath);
      }
    }
  } catch (e) {
    console.warn(`Warning: Could not list files in ${dir}: ${e.message}`);
  }
  return files;
}

// 取得 dist 資料夾所有檔案
const distFiles = getAllFiles('./dist');

// 生成 Service Worker
const swContent = `
const CACHE_NAME = 'stg-game-v${VERSION}';
const ASSETS = ${JSON.stringify(distFiles, null, 2)};

// 安裝時快取所有資源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// 啟用時清除舊快取
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('stg-game-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// 攔截請求，優先使用快取
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
`;

writeFileSync('./dist/sw.js', swContent.trim());
console.log(`[SW] Generated sw.js with version ${VERSION}`);
