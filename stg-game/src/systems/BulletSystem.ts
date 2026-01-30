import Phaser from 'phaser';
import { Bullet } from '../entities/Bullet';
import type { BulletOwner } from '../entities/Bullet';
import { PLAYER_BULLET, MOB_BULLET, ULTIMATE_BULLET } from '../data/BulletData';
import type { BulletDef } from '../data/BulletData';

/**
 * 子彈系統
 * - 管理所有子彈的生成、更新、回收
 */
export class BulletSystem {
  private scene: Phaser.Scene;
  private bullets: Bullet[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * 載入子彈資源
   */
  static preload(scene: Phaser.Scene): void {
    // 玩家子彈 (多幀動畫)
    for (let i = 0; i < PLAYER_BULLET.frameCount; i++) {
      scene.load.image(`player-bullet-${i}`, `player/player_bullet_${i}.png`);
    }
    // 怪物子彈
    for (let i = 0; i < MOB_BULLET.frameCount; i++) {
      scene.load.image(`mob-bullet-${i}`, `monster/mob_bullet_${i}.png`);
    }
  }

  /**
   * 每幀更新
   */
  update(delta: number): void {
    const screenW = this.scene.scale.width;
    const screenH = this.scene.scale.height;

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.update(delta);

      // 視野外剔除
      if (bullet.x < -50 || bullet.x > screenW + 50 ||
          bullet.y < -50 || bullet.y > screenH + 50 ||
          bullet.isMarkedDestroyed()) {
        bullet.destroy();
        this.bullets.splice(i, 1);
      }
    }
  }

  /**
   * 發射單發子彈
   */
  fire(
    x: number,
    y: number,
    angle: number,
    def: BulletDef,
    owner: BulletOwner,
    turnAfterUnits: number = 0,
    turnAngle: number = 0,
    isUltimate: boolean = false
  ): Bullet {
    const bullet = new Bullet(this.scene, x, y, angle, def, owner, turnAfterUnits, turnAngle, isUltimate);
    this.bullets.push(bullet);
    return bullet;
  }

  /**
   * 玩家彈幕：3發主砲
   * - 主砲：20度散開 (-10~+10)，2單位後漸進靠攏到 (-1~+1)
   */
  firePlayerSpread(x: number, y: number): void {
    const mainCount = 3;
    const fireStep = 10;  // 發射時每發差 10 度
    const turnStep = 1;   // 轉向後每發差 1 度

    for (let i = 0; i < mainCount; i++) {
      const offset = i - Math.floor(mainCount / 2); // -1, 0, 1
      const fireDeg = offset * fireStep;  // -10, 0, 10
      const turnDeg = offset * turnStep;  //  -1, 0,  1

      const fireRad = Phaser.Math.DegToRad(fireDeg);
      const turnRad = Phaser.Math.DegToRad(turnDeg);

      this.fire(x, y, fireRad, PLAYER_BULLET, 'player', 2, turnRad);
    }
  }

  /**
   * 怪物環形彈幕
   */
  fireCircle(x: number, y: number, count: number): void {
    const step = (Math.PI * 2) / count;
    for (let i = 0; i < count; i++) {
      this.fire(x, y, step * i, MOB_BULLET, 'monster');
    }
  }

  /**
   * 怪物扇形彈幕 (向左發射)
   * @param spreadDeg 扇形角度範圍
   * @param count 子彈數量
   */
  fireFan(x: number, y: number, spreadDeg: number, count: number): void {
    const baseAngle = Math.PI; // 向左
    const spreadRad = Phaser.Math.DegToRad(spreadDeg);
    const startAngle = baseAngle - spreadRad / 2;
    const step = count > 1 ? spreadRad / (count - 1) : 0;

    for (let i = 0; i < count; i++) {
      this.fire(x, y, startAngle + step * i, MOB_BULLET, 'monster');
    }
  }

  /**
   * V0.6.0: 發射大技能金色子彈
   */
  fireUltimate(x: number, y: number, angleDeg: number): Bullet {
    const angleRad = Phaser.Math.DegToRad(angleDeg);
    return this.fire(x, y, angleRad, ULTIMATE_BULLET, 'player', 0, 0, true);
  }

  /**
   * 取得玩家子彈
   */
  getPlayerBullets(): Bullet[] {
    return this.bullets.filter(b => b.getOwner() === 'player' && !b.isMarkedDestroyed());
  }

  /**
   * V0.6.0: 取得大技能子彈
   */
  getUltimateBullets(): Bullet[] {
    return this.bullets.filter(b => b.isUltimate() && !b.isMarkedDestroyed());
  }

  /**
   * 取得怪物子彈
   */
  getMonsterBullets(): Bullet[] {
    return this.bullets.filter(b => b.getOwner() === 'monster' && !b.isMarkedDestroyed());
  }

  /**
   * 移除子彈
   */
  removeBullet(bullet: Bullet): void {
    bullet.markDestroyed();
  }

  /**
   * 取得所有子彈數量
   */
  getBulletCount(): number {
    return this.bullets.length;
  }

  /**
   * 清除所有子彈
   */
  destroy(): void {
    for (const bullet of this.bullets) {
      bullet.destroy();
    }
    this.bullets = [];
  }
}
