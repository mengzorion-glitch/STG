# Change Log

## v0.6.0 - 技能數值系統 & UI (2026-01-30)

### 新增
- `Player.ts` 數值系統
  - HP 系統 (最大 200)
  - 能量系統 (最大 500)
  - 大技能施放與消耗
- `BulletData.ts` 大技能金色子彈
  - 速度 1200px/s，傷害 3
  - 淡金色 + 呼吸閃動效果
- `StatusBar.ts` - 狀態條 UI 元件
- `PlayerHUD.ts` - HP 條 + 能量條
- `GameOverScreen.ts` - 死亡結算畫面

### 功能
- 被子彈擊中 -1 HP
- 被怪物碰撞 -3 HP (500ms 無敵)
- 擊中敵人 +1 能量
- 能量滿 (500) 可右鍵施放大技能
- 8 方向金色子彈旋轉掃射 (每輪 +10°)
- 金色子彈可打消敵方彈幕
- HP 歸零顯示 Game Over 畫面
- 重新開始功能

### 技術細節
- 大技能發射間隔 50ms
- 能量消耗 每 0.02 秒 -1
- 施放中不累計能量

---

## v0.5.0 - 子彈系統 (2026-01-30)

### 新增
- `BulletData.ts` - 子彈定義檔
  - 玩家子彈: 800px/s，傷害1
  - 怪物子彈: 300px/s，傷害1
- `Bullet.ts` - 子彈實體類別
  - 轉向系統 (飛行一段距離後修正角度)
  - 動畫支援 (多幀閃爍)
- `BulletSystem.ts` - 子彈管理系統
  - 玩家彈幕: 7發主砲 + 2發副砲
  - 怪物環形/扇形彈幕
  - 視野外剔除
- 子彈圖片
  - `player_bullet_0~1.png` - 藍色橢圓光彈
  - `mob_bullet_0.png` - 紅色圓彈

### 功能
- 左鍵按住連射 (0.2秒間隔)
- 主砲 60度散開，2單位後漸進靠攏 (±30° → ±3°)
- 副砲 ±35度，4單位後修正到 ±15度
- 小怪每3秒 8發環形子彈
- 中怪停頓時 3波扇形子彈 (160度 8發)
- 碰撞檢測 (圓形碰撞)
- 小怪 15發死亡，中怪 50發死亡

### 技術細節
- 玩家子彈層級 depth: 7
- 怪物子彈層級 depth: 9
- 怪物攻擊回呼機制

---

## v0.4.0 - 怪物系統 (2026-01-30)

### 新增
- `MonsterData.ts` - 怪物定義檔
  - small: 0.5單位，S形曲線移動
  - medium: 1.5單位，衝刺-停頓移動
- `Monster.ts` - 怪物實體類別
  - 行為模式 (straight/sine/dash)
  - 受傷閃爍、死亡淡出效果
  - 單位大小縮放
- `MonsterSystem.ts` - 怪物生成管理
  - 自動生成 (2秒間隔)
  - 視野外剔除
  - 怪物清單管理
- 怪物圖片
  - `mob_small_0.png` - 紅色圓形
  - `mob_medium_0.png` - 紫色六邊形

### 技術細節
- 小怪: S形移動，振幅1單位，週期2秒
- 中怪: 衝刺3單位後停頓1秒
- 怪物層級 depth: 5

---

## v0.3.0 - 角色系統 (2026-01-30)

### 新增
- `Player.ts` - 玩家角色類別
  - 狀態機 (idle/attack/hurt)
  - 動畫系統 (獨立圖片組成動畫)
  - 左鍵拖曳跟隨移動
  - 畫面邊界限制
  - 單位大小設定 (2 單位)
- `AssetLoader.ts` - 資源載入輔助函式
  - loadPlayerAssets() 批量載入角色圖片
  - loadMonsterAssets() 預留怪物載入
- 角色圖片 (player/player_{action}_{frame}.png)
  - idle: 3 幀動畫
  - attack: 2 幀動畫
  - hurt: 1 幀動畫

### 技術細節
- 角色大小 = UNIT_SIZE × 2 = 216px
- 移動速度 800px/s
- 攻擊動畫 12fps，其他 8fps
- 受傷動畫播放完畢自動回 idle

---

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
