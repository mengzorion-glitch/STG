import Phaser from 'phaser';
import { Item } from '../entities/Item';
import type { ItemType } from '../entities/Item';
import { Player } from '../entities/Player';

/**
 * 道具管理系統
 */
export class ItemSystem {
  private scene: Phaser.Scene;
  private items: Item[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * 生成道具
   */
  spawn(x: number, y: number, type: ItemType): Item {
    const item = new Item(this.scene, x, y, type);
    this.items.push(item);
    return item;
  }

  /**
   * 每幀更新
   */
  update(delta: number): void {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.update(delta);

      // 視野外剔除或過期消失
      if (item.x < -50 || item.hasExpired()) {
        item.destroy();
        this.items.splice(i, 1);
      }
    }
  }

  /**
   * 檢查玩家碰撞並拾取道具
   * @returns 拾取的道具類型，或 null
   */
  checkPlayerPickup(player: Player): ItemType | null {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      const dist = Phaser.Math.Distance.Between(
        item.x, item.y,
        player.x, player.y
      );
      const hitRadius = item.getRadius() + player.getRadius();

      if (dist < hitRadius) {
        const type = item.getItemType();
        item.destroy();
        this.items.splice(i, 1);
        return type;
      }
    }
    return null;
  }

  /**
   * 清除所有道具
   */
  destroy(): void {
    for (const item of this.items) {
      item.destroy();
    }
    this.items = [];
  }
}
