import Phaser from 'phaser';

export type ItemType = 'bullet_up';

/**
 * 道具實體
 */
export class Item extends Phaser.GameObjects.Sprite {
  private itemType: ItemType;
  private moveSpeed: number = 100; // 向左移動速度

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
  }

  getItemType(): ItemType {
    return this.itemType;
  }

  getRadius(): number {
    return Math.max(this.displayWidth, this.displayHeight) / 2;
  }
}
