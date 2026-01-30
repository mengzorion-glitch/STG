import Phaser from 'phaser';
import { UNIT_SIZE } from '../config/GameConfig';
import type { MonsterDef } from '../data/MonsterData';

/**
 * 怪物實體
 * - 從畫面右側生成，向左移動
 * - 碰撞玩家造成傷害
 */
// 攻擊回呼類型
export type AttackType = 'circle' | 'fan' | 'boss_spiral' | 'boss_burst' | 'boss_wave';
export type AttackCallback = (monster: Monster, type: AttackType) => void;

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

  // 攻擊系統
  private attackTimer: number = 0;
  private attackCallback: AttackCallback | null = null;
  private dashFanWaveCount: number = 0;   // dash停頓時發射波數
  private dashFanWaveTimer: number = 0;   // dash扇形波間隔計時

  // BOSS 專用
  private bossSkills: AttackType[] = ['boss_spiral', 'boss_burst', 'boss_wave'];
  private bossTargetY: number = 0;        // BOSS 上下移動目標

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
    } else if (this.def.behavior === 'boss') {
      this.bossTargetY = this.y;
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
      case 'boss':
        this.updateBoss(deltaSeconds);
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

    // 攻擊: 每3秒噴出8發環形子彈
    if (this.def.attackInterval > 0 && this.attackCallback) {
      this.attackTimer += deltaSeconds * 1000;
      if (this.attackTimer >= this.def.attackInterval) {
        this.attackTimer = 0;
        this.attackCallback(this, 'circle');
      }
    }
  }

  /**
   * 衝刺-停頓移動
   */
  private updateDash(deltaSeconds: number): void {
    if (!this.isDashing) {
      // 停頓中
      this.dashPauseTimer -= deltaSeconds;

      // 停頓時發射3波扇形子彈 (間隔0.2秒)
      if (this.attackCallback && this.dashFanWaveCount < 3) {
        this.dashFanWaveTimer += deltaSeconds;
        if (this.dashFanWaveTimer >= 0.2) {
          this.dashFanWaveTimer = 0;
          this.dashFanWaveCount++;
          this.attackCallback(this, 'fan');
        }
      }

      if (this.dashPauseTimer <= 0) {
        this.setNextDashTarget();
        this.isDashing = true;
        this.dashFanWaveCount = 0;  // 重置波數
        this.dashFanWaveTimer = 0;
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
      this.dashFanWaveCount = 0;
      this.dashFanWaveTimer = 0;
      return;
    }

    // 移動向目標
    const moveSpeed = this.def.speed * 2; // 衝刺速度加倍
    const moveAmount = Math.min(moveSpeed * deltaSeconds, dist);
    this.x += (dx / dist) * moveAmount;
    this.y += (dy / dist) * moveAmount;
  }

  /**
   * BOSS 行為：停在右側，上下移動，隨機施放技能
   */
  private updateBoss(deltaSeconds: number): void {
    const screenW = this.scene.scale.width;
    const screenH = this.scene.scale.height;

    // 進場：移動到右側 1/4 位置
    const targetX = screenW * 0.75;
    if (this.x > targetX) {
      this.x -= this.def.speed * deltaSeconds;
      if (this.x < targetX) this.x = targetX;
    }

    // 上下移動
    const dy = this.bossTargetY - this.y;
    if (Math.abs(dy) > 5) {
      const moveY = Math.sign(dy) * this.def.speed * deltaSeconds;
      this.y += moveY;
    } else {
      // 到達目標，設定新目標
      const margin = this.displayHeight / 2 + 50;
      this.bossTargetY = Phaser.Math.Between(margin, screenH - margin);
    }

    // 攻擊：每隔一段時間隨機施放技能
    if (this.def.attackInterval > 0 && this.attackCallback) {
      this.attackTimer += deltaSeconds * 1000;
      if (this.attackTimer >= this.def.attackInterval) {
        this.attackTimer = 0;
        // 隨機選擇技能
        const skill = this.bossSkills[Math.floor(Math.random() * this.bossSkills.length)];
        this.attackCallback(this, skill);
      }
    }
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

  /**
   * 設定攻擊回呼
   */
  setAttackCallback(callback: AttackCallback): void {
    this.attackCallback = callback;
  }

  /**
   * 是否正在停頓 (dash用)
   */
  isPausing(): boolean {
    return this.def.behavior === 'dash' && !this.isDashing;
  }
}
