import Phaser from 'phaser';
import { UNIT_SIZE } from '../config/GameConfig';
import type { MonsterDef } from '../data/MonsterData';

/**
 * 怪物實體
 * - 從畫面右側生成，向左移動
 * - 碰撞玩家造成傷害
 */
export class Monster extends Phaser.GameObjects.Sprite {
  private def: MonsterDef;
  private currentHp: number;
  private isDead: boolean = false;

  // 行為狀態
  private elapsedTime: number = 0;        // 累計時間 (sine用)
  private baseY: number = 0;              // 基準Y位置 (sine用)
  private targetX: number = 0;            // 目標X (dash用)
  private targetY: number = 0;            // 目標Y (dash用)
  private dashPauseTimer: number = 0;     // 停頓計時 (dash用)
  private isDashing: boolean = false;     // 是否正在衝刺 (dash用)

  constructor(scene: Phaser.Scene, x: number, y: number, def: MonsterDef) {
    super(scene, x, y, `mob-${def.type}-0`);
    scene.add.existing(this);

    this.def = def;
    this.currentHp = def.hp;
    this.baseY = y;

    this.setDepth(5);  // 怪物層級 (背景之上，玩家之下)
    this.setUnitSize(def.unitSize);
    this.initAnimation();
    this.initBehavior();
  }

  /**
   * 初始化行為模式
   */
  private initBehavior(): void {
    if (this.def.behavior === 'dash') {
      this.setNextDashTarget();
      this.isDashing = true;
    }
  }

  /**
   * 設定下一個衝刺目標點
   * 往前方3個單位，90度角度內隨機
   */
  private setNextDashTarget(): void {
    const distance = UNIT_SIZE * 3;
    // 90度範圍: -45度 到 +45度 (以左方為基準)
    const angle = Phaser.Math.Between(-45, 45);
    const rad = Phaser.Math.DegToRad(180 + angle); // 180度=左方

    this.targetX = this.x + Math.cos(rad) * distance;
    this.targetY = this.y + Math.sin(rad) * distance;
  }

  /**
   * 設定怪物大小 (以單位為基準)
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
    const animKey = `mob-${this.def.type}-idle`;
    if (this.scene.anims.exists(animKey)) {
      this.play(animKey);
      return;
    }

    // 建立動畫
    const frames: Phaser.Types.Animations.AnimationFrame[] = [];
    for (let i = 0; i < this.def.frameCount; i++) {
      frames.push({ key: `mob-${this.def.type}-${i}` });
    }

    this.scene.anims.create({
      key: animKey,
      frames: frames,
      frameRate: 6,
      repeat: -1,
    });

    this.play(animKey);
  }

  /**
   * 每幀更新
   */
  update(delta: number): void {
    if (this.isDead) return;

    const deltaSeconds = delta / 1000;

    switch (this.def.behavior) {
      case 'sine':
        this.updateSine(deltaSeconds);
        break;
      case 'dash':
        this.updateDash(deltaSeconds);
        break;
      default:
        // straight: 單純向左
        this.x -= this.def.speed * deltaSeconds;
        break;
    }
  }

  /**
   * S形曲線移動
   */
  private updateSine(deltaSeconds: number): void {
    this.elapsedTime += deltaSeconds;

    // 向左移動
    this.x -= this.def.speed * deltaSeconds;

    // Y軸正弦波動 (振幅1單位，週期2秒)
    const amplitude = UNIT_SIZE;
    const frequency = Math.PI; // 2秒一個週期
    this.y = this.baseY + Math.sin(this.elapsedTime * frequency) * amplitude;
  }

  /**
   * 衝刺-停頓移動
   */
  private updateDash(deltaSeconds: number): void {
    if (!this.isDashing) {
      // 停頓中
      this.dashPauseTimer -= deltaSeconds;
      if (this.dashPauseTimer <= 0) {
        this.setNextDashTarget();
        this.isDashing = true;
      }
      return;
    }

    // 衝刺中 - 向目標移動
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 5) {
      // 到達目標，開始停頓
      this.isDashing = false;
      this.dashPauseTimer = 1; // 停頓1秒
      return;
    }

    // 移動向目標
    const moveSpeed = this.def.speed * 2; // 衝刺速度加倍
    const moveAmount = Math.min(moveSpeed * deltaSeconds, dist);
    this.x += (dx / dist) * moveAmount;
    this.y += (dy / dist) * moveAmount;
  }

  /**
   * 受到傷害
   * @returns true 如果怪物死亡
   */
  takeDamage(amount: number): boolean {
    if (this.isDead) return false;

    this.currentHp -= amount;

    // 受擊閃爍
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => this.clearTint());

    if (this.currentHp <= 0) {
      this.die();
      return true;
    }
    return false;
  }

  /**
   * 死亡處理
   */
  private die(): void {
    this.isDead = true;
    // 簡單淡出效果
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: this.scale * 1.5,
      duration: 200,
      onComplete: () => this.destroy(),
    });
  }

  getExp(): number {
    return this.def.exp;
  }

  getDamage(): number {
    return this.def.damage;
  }

  isAlive(): boolean {
    return !this.isDead;
  }

  getType(): string {
    return this.def.type;
  }

  getRadius(): number {
    return Math.min(this.displayWidth, this.displayHeight) / 2;
  }
}
