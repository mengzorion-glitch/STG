import Phaser from 'phaser';
import { UNIT_SIZE } from '../config/GameConfig';
import type { BulletDef } from '../data/BulletData';

export type BulletOwner = 'player' | 'monster';

/**
 * 子彈實體
 * - 支援轉向系統 (飛行一段距離後修正角度)
 */
export class Bullet extends Phaser.GameObjects.Sprite {
  private def: BulletDef;
  private owner: BulletOwner;
  private velocityX: number;
  private velocityY: number;
  private isDestroyed: boolean = false;

  // 轉向系統
  private startX: number;
  private startY: number;
  private turnDistance: number = 0;
  private turnAngle: number = 0;
  private hasTurned: boolean = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    angle: number,
    def: BulletDef,
    owner: BulletOwner,
    turnAfterUnits: number = 0,
    turnAngle: number = 0
  ) {
    super(scene, x, y, `${def.key}-0`);
    scene.add.existing(this);

    this.def = def;
    this.owner = owner;
    this.startX = x;
    this.startY = y;
    this.turnDistance = turnAfterUnits * UNIT_SIZE;
    this.turnAngle = turnAngle;

    // 計算速度向量
    this.velocityX = Math.cos(angle) * def.speed;
    this.velocityY = Math.sin(angle) * def.speed;

    // 設定層級: 玩家子彈 7, 怪物子彈 9
    this.setDepth(owner === 'player' ? 7 : 9);
    this.setRotation(angle);

    // 縮放 (unitSize > 0 才縮放)
    if (def.unitSize > 0) {
      this.setUnitSize(def.unitSize);
    }

    this.initAnimation();
  }

  /**
   * 設定大小 (以單位為基準)
   */
  private setUnitSize(units: number): void {
    const targetSize = UNIT_SIZE * units;
    const maxDimension = Math.max(this.width, this.height);
    if (maxDimension > 0) {
      const scale = targetSize / maxDimension;
      this.setScale(scale);
    }
  }

  /**
   * 初始化動畫
   */
  private initAnimation(): void {
    if (this.def.frameCount <= 1) return;

    const animKey = `${this.def.key}-anim`;
    if (!this.scene.anims.exists(animKey)) {
      const frames: Phaser.Types.Animations.AnimationFrame[] = [];
      for (let i = 0; i < this.def.frameCount; i++) {
        frames.push({ key: `${this.def.key}-${i}` });
      }
      this.scene.anims.create({
        key: animKey,
        frames: frames,
        frameRate: 12,
        repeat: -1,
      });
    }
    this.play(animKey);
  }

  /**
   * 每幀更新
   */
  update(delta: number): void {
    if (this.isDestroyed) return;

    const dt = delta / 1000;
    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;

    // 檢查是否需要轉向
    if (this.turnDistance > 0 && !this.hasTurned) {
      const traveled = Phaser.Math.Distance.Between(
        this.startX, this.startY, this.x, this.y
      );
      if (traveled >= this.turnDistance) {
        this.hasTurned = true;
        // 轉向到指定角度
        this.velocityX = Math.cos(this.turnAngle) * this.def.speed;
        this.velocityY = Math.sin(this.turnAngle) * this.def.speed;
        this.setRotation(this.turnAngle);
      }
    }
  }

  /**
   * 取得擁有者
   */
  getOwner(): BulletOwner {
    return this.owner;
  }

  /**
   * 取得傷害值
   */
  getDamage(): number {
    return this.def.damage;
  }

  /**
   * 取得碰撞半徑
   */
  getRadius(): number {
    return this.def.size;
  }

  /**
   * 標記為銷毀
   */
  markDestroyed(): void {
    this.isDestroyed = true;
  }

  /**
   * 是否已被標記銷毀
   */
  isMarkedDestroyed(): boolean {
    return this.isDestroyed;
  }
}
