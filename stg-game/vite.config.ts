import { defineConfig } from 'vite';
import { readFileSync } from 'fs';

// 讀取 package.json 版本號
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default defineConfig({
  base: '/stg-game/',  // GitHub Pages 路徑
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version)
  },
  build: {
    assetsInlineLimit: 0
  }
});
