import Phaser from 'phaser';

export type ItemType = 'bullet_up';

/**
 * 道具實體
 */
export class Item extends Phaser.GameObjects.Sprite {
  private itemType: ItemType;
  private moveSpeed: number = 100; // 向左移動速度
  private lifetime: number = 0;    // 存在時間
  private readonly MAX_LIFETIME = 10000;  // 10 秒
  private readonly BLINK_START = 7000;    // 7 秒開始閃爍
  private isExpired: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, type: ItemType) {
    // 使用玩家子彈圖片
    super(scene, x, y, 'player-bullet-0');
    scene.add.existing(this);

    this.itemType = type;
    this.setDepth(6); // 在怪物之上，玩家子彈之下
    this.setScale(2); // 放大讓玩家容易看到
    this.setTint(0x00ff00); // 綠色標示為道具
  }

  update(delta: number): void {
    // 向左移動
    this.x -= this.moveSpeed * (delta / 1000);

    // 更新存在時間
    this.lifetime += delta;

    // 閃爍效果 (7秒後開始)
    if (this.lifetime >= this.BLINK_START && this.lifetime < this.MAX_LIFETIME) {
      // 閃爍頻率隨時間加快
      const blinkProgress = (this.lifetime - this.BLINK_START) / (this.MAX_LIFETIME - this.BLINK_START);
      const blinkSpeed = 5 + blinkProgress * 15; // 5~20 Hz
      const blink = Math.sin(this.lifetime * blinkSpeed * 0.01) > 0;
      this.setAlpha(blink ? 1 : 0.3);
    }

    // 超過時間標記為過期
    if (this.lifetime >= this.MAX_LIFETIME) {
      this.isExpired = true;
    }
  }

  getItemType(): ItemType {
    return this.itemType;
  }

  getRadius(): number {
    // 使用較小的碰撞半徑，確保需要實際觸碰
    return Math.min(this.displayWidth, this.displayHeight) / 4;
  }

  hasExpired(): boolean {
    return this.isExpired;
  }
}
