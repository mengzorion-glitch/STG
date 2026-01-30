import Phaser from 'phaser';
import { StatusBar } from './StatusBar';

/**
 * 玩家狀態 HUD
 * - HP 條 (紅色)
 * - 能量條 (黃色)
 */
export class PlayerHUD {
  private hpBar: StatusBar;
  private energyBar: StatusBar;
  private hpText: Phaser.GameObjects.Text;
  private energyText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    const padding = 20;
    const barWidth = 200;

    // HP 條 (紅色)
    this.hpBar = new StatusBar(scene, padding, padding, barWidth, 20, 0xff4444);
    this.hpText = scene.add.text(padding + barWidth + 8, padding, '200/200', {
      fontSize: '16px',
      color: '#ffffff',
    }).setDepth(100);

    // 能量條 (黃色)
    this.energyBar = new StatusBar(scene, padding, padding + 28, barWidth, 14, 0xffcc00);
    this.energyText = scene.add.text(padding + barWidth + 8, padding + 26, '0/500', {
      fontSize: '12px',
      color: '#ffcc00',
    }).setDepth(100);
  }

  /**
   * 更新 HP 顯示
   */
  updateHP(current: number, max: number): void {
    this.hpBar.setValue(current / max);
    this.hpText.setText(`${Math.ceil(current)}/${max}`);
  }

  /**
   * 更新能量顯示
   */
  updateEnergy(current: number, max: number): void {
    this.energyBar.setValue(current / max);
    this.energyText.setText(`${Math.ceil(current)}/${max}`);
    // 滿能量時文字變白
    this.energyText.setColor(current >= max ? '#ffffff' : '#ffcc00');
  }

  destroy(): void {
    this.hpBar.destroy();
    this.energyBar.destroy();
    this.hpText.destroy();
    this.energyText.destroy();
  }
}
