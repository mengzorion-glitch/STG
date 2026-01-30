import Phaser from 'phaser';

/**
 * 遊戲結束畫面
 */
export class GameOverScreen {
  private container: Phaser.GameObjects.Container;
  private overlay: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, survivalTime: number) {
    const { width, height } = scene.cameras.main;

    // 半透明遮罩
    this.overlay = scene.add.graphics();
    this.overlay.fillStyle(0x000000, 0.7);
    this.overlay.fillRect(0, 0, width, height);
    this.overlay.setDepth(199);

    // 內容容器
    this.container = scene.add.container(width / 2, height / 2);
    this.container.setDepth(200);

    // 標題
    const title = scene.add.text(0, -80, 'GAME OVER', {
      fontSize: '64px',
      color: '#ff4444',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // 存活時間
    const timeText = scene.add.text(0, 0, `存活時間: ${Math.floor(survivalTime)} 秒`, {
      fontSize: '32px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // 重新開始按鈕
    const restartBtn = scene.add.text(0, 80, '[ 重新開始 ]', {
      fontSize: '36px',
      color: '#ffcc00',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    restartBtn.on('pointerover', () => restartBtn.setColor('#ffffff'));
    restartBtn.on('pointerout', () => restartBtn.setColor('#ffcc00'));
    restartBtn.on('pointerdown', () => {
      this.destroy();
      scene.scene.restart();
    });

    this.container.add([title, timeText, restartBtn]);
  }

  destroy(): void {
    this.overlay.destroy();
    this.container.destroy();
  }
}
