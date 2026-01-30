import Phaser from 'phaser';
import { UNIT_SIZE } from '../config/GameConfig';

export type PlayerState = 'idle' | 'attack' | 'hurt';

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

  /**
   * 受到傷害
   */
  takeDamage(_amount: number): void {
    // 播放受傷動畫
    this.setPlayerState('hurt');
  }

  /**
   * 取得碰撞半徑
   */
  getRadius(): number {
    return Math.min(this.displayWidth, this.displayHeight) / 2;
  }

  getState(): PlayerState {
    return this.currentState;
  }
}
