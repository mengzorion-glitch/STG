import Phaser from 'phaser';

/**
 * 遊戲設計基準尺寸
 * - 高度固定 1080
 * - 寬度以 1920 為基準，實際會根據螢幕比例動態調整
 */
export const GAME_HEIGHT = 1080;
export const BASE_WIDTH = 1920;  // 設計基準寬度 (16:9)

/**
 * 單位系統
 * 1 單位 = 畫面高度的 10% = 108px
 * 用於統一遊戲內物件的大小定義
 */
export const UNIT_SIZE = GAME_HEIGHT * 0.1;  // 108px

/**
 * 取得當前遊戲實際寬度
 * 在 EXPAND 模式下，寬度會根據螢幕比例動態變化
 */
export function getGameWidth(scene: Phaser.Scene): number {
  return scene.scale.width;
}

/**
 * 取得當前遊戲實際高度 (應始終為 1080)
 */
export function getGameHeight(scene: Phaser.Scene): number {
  return scene.scale.height;
}

/**
 * UI 錨點位置
 * 用於自適應不同螢幕比例的 UI 定位
 */
export interface UIAnchors {
  // 四角
  topLeft: Phaser.Math.Vector2;
  topRight: Phaser.Math.Vector2;
  bottomLeft: Phaser.Math.Vector2;
  bottomRight: Phaser.Math.Vector2;
  // 四邊中點
  topCenter: Phaser.Math.Vector2;
  bottomCenter: Phaser.Math.Vector2;
  leftCenter: Phaser.Math.Vector2;
  rightCenter: Phaser.Math.Vector2;
  // 正中央
  center: Phaser.Math.Vector2;
}

/**
 * 取得 UI 錨點位置
 * @param scene Phaser 場景
 * @param padding 邊緣內縮距離 (預設 0)
 */
export function getUIAnchors(scene: Phaser.Scene, padding: number = 0): UIAnchors {
  const w = scene.scale.width;
  const h = scene.scale.height;
  const p = padding;

  return {
    topLeft: new Phaser.Math.Vector2(p, p),
    topRight: new Phaser.Math.Vector2(w - p, p),
    bottomLeft: new Phaser.Math.Vector2(p, h - p),
    bottomRight: new Phaser.Math.Vector2(w - p, h - p),
    topCenter: new Phaser.Math.Vector2(w / 2, p),
    bottomCenter: new Phaser.Math.Vector2(w / 2, h - p),
    leftCenter: new Phaser.Math.Vector2(p, h / 2),
    rightCenter: new Phaser.Math.Vector2(w - p, h / 2),
    center: new Phaser.Math.Vector2(w / 2, h / 2),
  };
}

/**
 * 取得設計基準區域邊界 (1920x1080 的核心區域)
 * 用於確保核心內容在任何螢幕比例下都可見
 */
export function getSafeZone(scene: Phaser.Scene): Phaser.Geom.Rectangle {
  const w = scene.scale.width;
  const h = scene.scale.height;
  const safeLeft = (w - BASE_WIDTH) / 2;

  return new Phaser.Geom.Rectangle(
    Math.max(0, safeLeft),
    0,
    Math.min(BASE_WIDTH, w),
    h
  );
}

export const GameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.EXPAND,            // 高度固定，寬度動態擴展
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: BASE_WIDTH,
    height: GAME_HEIGHT,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  input: {
    activePointers: 2,
    touch: { capture: true }
  },
  render: {
    pixelArt: false,
    antialias: true
  }
};
