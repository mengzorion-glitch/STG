# Change Log

## v0.2.0 - 視差背景系統 (2026-01-30)

### 新增
- `ParallaxBackground.ts` - 視差背景系統類別
  - 多層背景管理
  - TileSprite 無縫捲動
  - 動態寬度支援 (EXPAND 模式)
  - resize 自動調整
- 背景圖片
  - `bg_far.png` - 遠景星空 (speed: 0.1)
  - `bg_mid.png` - 中景山脈 (speed: 0.6)

### 技術細節
- 使用 tilePositionX 實現無縫捲動
- setScrollFactor(0) 固定背景於攝影機

---

## v0.1.0 - 基礎遊戲框架 (2026-01-30)

### 新增
- `GameConfig.ts` - Phaser 遊戲設定檔
  - 高度固定 1080，寬度動態擴展 (EXPAND 模式)
  - UI 錨點系統 (九宮格定位)
  - 單位系統 (1 單位 = 108px)
- `StartScene.ts` - 開始場景
  - 資源載入進度條
  - 封面 2 秒淡入動畫
  - "PRESS TO START" 閃爍提示
  - 版本號顯示 (右下角)
- `MainScene.ts` - 主遊戲場景
  - 輸入系統 (方向鍵/WASD/觸控拖曳)
  - 對角線移動正規化
  - 除錯資訊顯示 (FPS/尺寸/輸入狀態)
- 視窗 resize 事件處理

### 技術細節
- Scale.EXPAND 模式支援不同螢幕比例
- 多點觸控支援 (activePointers: 2)
- Arcade Physics 零重力設定

---

## v0.0.0 - 專案環境建置 (2026-01-30)

### 新增
- Vite + TypeScript 專案初始化 (vanilla-ts 模板)
- Phaser 3 遊戲引擎安裝 (v3.90.0)
- 專案目錄結構建立
  - `src/scenes/` - Phaser 場景
  - `src/systems/` - 遊戲系統
  - `src/config/` - 設定檔
  - `src/entities/` - 遊戲實體
  - `src/data/` - 資料定義
  - `src/utils/` - 工具函式
  - `src/ui/` - UI 元件
- GitHub Actions 自動部署設定 (`.github/workflows/deploy.yml`)
- PWA 基礎設定
  - `manifest.json` - PWA manifest
  - `generate-sw.js` - Service Worker 生成腳本
  - PWA 圖示 (192x192, 512x512)
- 基礎 HTML/CSS 設定
  - 手機直立時顯示橫向提示
  - 禁止雙指縮放
  - 禁止觸控選取

### 技術規格
- Node.js 20+
- Vite 7.x
- TypeScript 5.x (strict mode)
- Phaser 3.90.0
