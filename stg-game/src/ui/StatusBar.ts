import Phaser from 'phaser';

/**
 * 狀態條 UI 元件
 */
export class StatusBar {
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private background: Phaser.GameObjects.Graphics;
  private fill: Phaser.GameObjects.Graphics;
  private fillColor: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    color: number
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.fillColor = color;

    // 背景
    this.background = scene.add.graphics();
    this.background.fillStyle(0x333333, 0.8);
    this.background.fillRoundedRect(x, y, width, height, 4);
    this.background.setDepth(100);

    // 填充
    this.fill = scene.add.graphics();
    this.fill.setDepth(100);
    this.setValue(1);
  }

  /**
   * 設定填充比例 (0~1)
   */
  setValue(percent: number): void {
    percent = Phaser.Math.Clamp(percent, 0, 1);
    this.fill.clear();
    this.fill.fillStyle(this.fillColor, 1);
    const fillWidth = (this.width - 4) * percent;
    if (fillWidth > 0) {
      this.fill.fillRoundedRect(
        this.x + 2,
        this.y + 2,
        fillWidth,
        this.height - 4,
        3
      );
    }
  }

  destroy(): void {
    this.background.destroy();
    this.fill.destroy();
  }
}
