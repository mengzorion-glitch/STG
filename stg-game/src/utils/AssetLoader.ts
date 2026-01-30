import Phaser from 'phaser';

/**
 * 動畫設定
 */
export interface AnimationConfig {
  key: string;        // 動作名稱 (idle, attack, hurt)
  frameCount: number; // 幀數
}

/**
 * 載入角色圖片資源
 * 檔案命名格式：{basePath}_{action}_{frame}.png
 * @param scene Phaser 場景
 * @param basePath 基礎路徑與前綴 (例如 'player')
 * @param animations 動畫設定陣列
 */
export function loadPlayerAssets(
  scene: Phaser.Scene,
  basePath: string,
  animations: AnimationConfig[]
): void {
  for (const anim of animations) {
    for (let i = 0; i < anim.frameCount; i++) {
      // key: player-idle-0, path: player/player_idle_0.png
      scene.load.image(
        `${basePath}-${anim.key}-${i}`,
        `${basePath}/${basePath}_${anim.key}_${i}.png`
      );
    }
  }
}

/**
 * 載入怪物圖片資源
 * @param scene Phaser 場景
 * @param type 怪物類型 (例如 'small', 'medium')
 * @param frameCount 幀數
 */
export function loadMonsterAssets(
  scene: Phaser.Scene,
  type: string,
  frameCount: number
): void {
  for (let i = 0; i < frameCount; i++) {
    scene.load.image(
      `mob-${type}-${i}`,
      `monster/mob_${type}_${i}.png`
    );
  }
}
