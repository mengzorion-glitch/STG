import Phaser from 'phaser';
import { UNIT_SIZE } from '../config/GameConfig';

export type PlayerState = 'idle' | 'attack' | 'hurt';

// V0.6.0: 數值常數
const MAX_HP = 200;
const MAX_ENERGY = 500;
const BULLET_DAMAGE = 1;
const COLLISION_DAMAGE = 3;
const ENERGY_DRAIN_INTERVAL = 0.02; // 秒

/**
 * 玩家角色
 * - 大小：2 單位 (畫面高度的 20%)
 * - 跟隨滑鼠/觸控位置移動
 * - 左鍵按住：移動 + 發射子彈
 * - 右鍵：施放技能
 */
export class Player extends Phaser.GameObjects.Sprite {
  private currentState: PlayerState = 'idle';
  private moveSpeed: number = 800;
  private targetPos: Phaser.Math.Vector2 | null = null;

  // V0.6.0: 數值系統
  private hp: number = MAX_HP;
  private energy: number = 0;
  private isUltActive: boolean = false;
  private energyDrainTimer: number = 0;

  // 主砲彈數
  private bulletCount: number = 3;
  private readonly MAX_BULLET_COUNT = 6;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // 使用第一張 idle 圖片作為初始材質
    super(scene, x, y, 'player-idle-0');
    scene.add.existing(this);

    this.setDepth(10);

    // 設定角色大小為 2 單位
    this.setUnitSize(2);
  }

  /**
   * 設定角色大小 (以單位為基準)
   * @param units 單位數 (1 單位 = 畫面高度 10%)
   */
  setUnitSize(units: number): this {
    const targetSize = UNIT_SIZE * units;
    // 以較大邊為基準縮放，確保完整顯示
    const maxDimension = Math.max(this.width, this.height);
    if (maxDimension > 0) {
      const scale = targetSize / maxDimension;
      this.setScale(scale);
    }
    return this;
  }

  /**
   * 初始化動畫 (需在資源載入後呼叫)
   */
  initAnimations(frameConfig: { [key: string]: number }): void {
    const actions = ['idle', 'attack', 'hurt'];

    for (const action of actions) {
      const animKey = `player-${action}`;
      if (this.scene.anims.exists(animKey)) continue;

      const frameCount = frameConfig[action] || 1;
      const frames: Phaser.Types.Animations.AnimationFrame[] = [];

      for (let i = 0; i < frameCount; i++) {
        frames.push({ key: `player-${action}-${i}` });
      }

      this.scene.anims.create({
        key: animKey,
        frames: frames,
        frameRate: action === 'attack' ? 12 : 8,
        repeat: action === 'hurt' ? 0 : -1,
      });
    }

    this.play('player-idle');
  }

  /**
   * 設定角色狀態
   */
  setPlayerState(state: PlayerState): void {
    if (this.currentState === state) return;
    this.currentState = state;

    switch (state) {
      case 'idle':
        this.play('player-idle');
        break;
      case 'attack':
        this.play('player-attack');
        break;
      case 'hurt':
        this.play('player-hurt');
        this.once('animationcomplete', () => this.setPlayerState('idle'));
        break;
    }
  }

  /**
   * 設定目標位置 (滑鼠/觸控位置)
   */
  setTargetPosition(pos: Phaser.Math.Vector2 | null): void {
    this.targetPos = pos;
  }

  /**
   * 每幀更新
   */
  update(delta: number): void {
    if (!this.targetPos) return;

    const dx = this.targetPos.x - this.x;
    const dy = this.targetPos.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 到達目標位置附近就停止
    if (distance < 5) return;

    // 計算移動量
    const moveDistance = this.moveSpeed * (delta / 1000);
    const ratio = Math.min(moveDistance / distance, 1);

    let newX = this.x + dx * ratio;
    let newY = this.y + dy * ratio;

    // 畫面邊界限制
    const halfW = this.displayWidth / 2;
    const halfH = this.displayHeight / 2;
    const screenW = this.scene.scale.width;
    const screenH = this.scene.scale.height;

    newX = Phaser.Math.Clamp(newX, halfW, screenW - halfW);
    newY = Phaser.Math.Clamp(newY, halfH, screenH - halfH);

    this.setPosition(newX, newY);
  }

  // #region V0.6.0: HP 系統
  getHP(): number {
    return this.hp;
  }

  getMaxHP(): number {
    return MAX_HP;
  }

  /**
   * 受到子彈傷害 (-1 HP)
   */
  takeBulletDamage(): void {
    this.hp = Math.max(0, this.hp - BULLET_DAMAGE);
    this.setPlayerState('hurt');
  }

  /**
   * 受到碰撞傷害 (-3 HP)
   */
  takeCollisionDamage(): void {
    this.hp = Math.max(0, this.hp - COLLISION_DAMAGE);
    this.setPlayerState('hurt');
  }

  /**
   * 舊版相容 (供 v0.5.0 碰撞使用)
   */
  takeDamage(_amount: number): void {
    this.takeBulletDamage();
  }

  isDead(): boolean {
    return this.hp <= 0;
  }
  // #endregion HP 系統

  // #region V0.6.0: 能量系統
  getEnergy(): number {
    return this.energy;
  }

  getMaxEnergy(): number {
    return MAX_ENERGY;
  }

  /**
   * 增加能量 (擊中敵人時呼叫)
   */
  addEnergy(amount: number = 1): void {
    if (this.isUltActive) return; // 施放中不累計
    this.energy = Math.min(MAX_ENERGY, this.energy + amount);
  }

  /**
   * 是否可施放大技能
   */
  canUseUlt(): boolean {
    return this.energy >= MAX_ENERGY && !this.isUltActive;
  }

  /**
   * 啟動大技能
   */
  activateUlt(): boolean {
    if (!this.canUseUlt()) return false;
    this.isUltActive = true;
    this.energyDrainTimer = 0;
    return true;
  }

  /**
   * 大技能是否啟動中
   */
  isUltimateActive(): boolean {
    return this.isUltActive;
  }

  /**
   * 更新能量消耗 (每幀呼叫)
   */
  updateEnergy(delta: number): void {
    if (!this.isUltActive) return;

    this.energyDrainTimer += delta / 1000;

    while (this.energyDrainTimer >= ENERGY_DRAIN_INTERVAL) {
      this.energyDrainTimer -= ENERGY_DRAIN_INTERVAL;
      this.energy -= 1;

      if (this.energy <= 0) {
        this.energy = 0;
        this.isUltActive = false;
        break;
      }
    }
  }
  // #endregion 能量系統

  /**
   * 取得碰撞半徑
   */
  getRadius(): number {
    return Math.min(this.displayWidth, this.displayHeight) / 2;
  }

  getState(): PlayerState {
    return this.currentState;
  }

  // #region 主砲彈數
  getBulletCount(): number {
    return this.bulletCount;
  }

  addBulletCount(amount: number = 1): void {
    this.bulletCount = Math.min(this.MAX_BULLET_COUNT, this.bulletCount + amount);
  }
  // #endregion
}
