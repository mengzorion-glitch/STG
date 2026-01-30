import Phaser from 'phaser';
import { getUIAnchors } from '../config/GameConfig';

declare const __APP_VERSION__: string;

/**
 * 開始場景
 * - 載入遊戲資源
 * - 顯示封面與版本號
 * - 等待玩家點擊開始
 */
export class StartScene extends Phaser.Scene {
  private cover!: Phaser.GameObjects.Image;
  private pressText!: Phaser.GameObjects.Text;
  private versionText!: Phaser.GameObjects.Text;

  constructor() {
    super('StartScene');
  }

  preload(): void {
    this.createLoadingBar();
    this.load.image('cover', 'images/bg_start_cover.png');
  }

  create(): void {
    const h = this.scale.height;
    const anchors = getUIAnchors(this, 10);

    // 封面背景 - 初始透明，置中並縮放填滿
    this.cover = this.add.image(anchors.center.x, anchors.center.y, 'cover');
    this.fitCover();
    this.cover.setAlpha(0);

    // PRESS TO START - 下方中央
    this.pressText = this.add.text(anchors.bottomCenter.x, h - 150, 'PRESS TO START', {
      fontSize: '84px',
      color: '#ffffff',
      fontFamily: 'Arial',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setAlpha(0);

    // 版本號 - 右下角
    this.versionText = this.add.text(anchors.bottomRight.x, anchors.bottomRight.y, 'v' + __APP_VERSION__, {
      fontSize: '16px',
      color: '#aaaaaa',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(1, 1).setAlpha(0);

    // 2秒淡入封面和標題
    this.tweens.add({
      targets: [this.cover, this.versionText],
      alpha: 1,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => {
        this.tweens.add({
          targets: this.pressText,
          alpha: { from: 0, to: 1 },
          duration: 500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });

        this.input.once('pointerdown', () => {
          this.scene.start('MainScene');
        });
      }
    });

    // 監聽視窗大小變化
    this.scale.on('resize', this.onResize, this);
  }

  private fitCover(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const scaleX = w / this.cover.width;
    const scaleY = h / this.cover.height;
    const scale = Math.max(scaleX, scaleY);
    this.cover.setScale(scale);
    this.cover.setPosition(w / 2, h / 2);
  }

  private onResize(gameSize: Phaser.Structs.Size): void {
    const h = gameSize.height;
    const anchors = getUIAnchors(this, 10);

    this.fitCover();
    this.pressText.setPosition(anchors.bottomCenter.x, h - 150);
    this.versionText.setPosition(anchors.bottomRight.x, anchors.bottomRight.y);
  }

  private createLoadingBar(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const barWidth = 320;
    const barHeight = 40;
    const centerX = w / 2;
    const centerY = h / 2;

    const loadingText = this.add.text(centerX, centerY - 40, 'Loading...', {
      font: '20px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(centerX - barWidth / 2, centerY, barWidth, barHeight);

    const progressBar = this.add.graphics();

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(
        centerX - barWidth / 2 + 5,
        centerY + 5,
        (barWidth - 10) * value,
        barHeight - 10
      );
    });

    this.load.on('complete', () => {
      loadingText.destroy();
      progressBar.destroy();
      progressBox.destroy();
    });
  }
}
