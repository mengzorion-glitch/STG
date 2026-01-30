import Phaser from 'phaser';
import { GAME_HEIGHT } from '../config/GameConfig';

/**
 * 視差背景圖層
 */
interface ParallaxLayer {
  sprite: Phaser.GameObjects.TileSprite;
  speed: number;
}

/**
 * 視差背景系統
 * 管理多層背景的無縫捲動
 * 支援 EXPAND 模式下的動態寬度
 */
export class ParallaxBackground {
  private scene: Phaser.Scene;
  private layers: ParallaxLayer[] = [];
  private baseSpeed: number = 0.05;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // 監聽視窗大小變化，更新背景尺寸
    this.scene.scale.on('resize', this.onResize, this);
  }

  /**
   * 新增背景圖層
   * @param key 圖片資源 key
   * @param speed 相對捲動速度 (0~1, 數值越小越慢，表示越遠)
   * @param depth 圖層深度 (越小越底層)
   */
  addLayer(key: string, speed: number, depth: number): void {
    const w = this.scene.scale.width;
    const h = GAME_HEIGHT;

    // 使用動態寬度建立 TileSprite
    const sprite = this.scene.add.tileSprite(
      w / 2,
      h / 2,
      w,
      h,
      key
    );

    sprite.setDepth(depth);
    sprite.setScrollFactor(0);

    this.layers.push({ sprite, speed });
  }

  /**
   * 視窗大小變化時更新背景尺寸
   */
  private onResize(gameSize: Phaser.Structs.Size): void {
    const w = gameSize.width;
    const h = gameSize.height;

    for (const layer of this.layers) {
      layer.sprite.setPosition(w / 2, h / 2);
      layer.sprite.setSize(w, h);
    }
  }

  /**
   * 每幀更新捲動位置
   * @param delta 幀間隔時間 (ms)
   */
  update(delta: number): void {
    for (const layer of this.layers) {
      layer.sprite.tilePositionX += this.baseSpeed * layer.speed * delta;
    }
  }

  /**
   * 設定基礎捲動速度
   */
  setBaseSpeed(speed: number): void {
    this.baseSpeed = speed;
  }

  /**
   * 清除所有圖層
   */
  destroy(): void {
    this.scene.scale.off('resize', this.onResize, this);
    for (const layer of this.layers) {
      layer.sprite.destroy();
    }
    this.layers = [];
  }
}
