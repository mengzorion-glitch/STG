import Phaser from 'phaser';
import { getUIAnchors } from '../config/GameConfig';

/**
 * 主遊戲場景
 * V0.1.0: 基礎框架與輸入系統
 */
export class MainScene extends Phaser.Scene {
  // #region 輸入系統
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private touchTarget: Phaser.Math.Vector2 | null = null;
  // #endregion 輸入系統

  // #region 除錯顯示
  private debugText!: Phaser.GameObjects.Text;
  // #endregion 除錯顯示

  constructor() {
    super('MainScene');
  }

  create(): void {
    this.setupInput();
    this.setupUI();

    // 監聽視窗大小變化
    this.scale.on('resize', this.onResize, this);
  }

  update(_time: number, delta: number): void {
    const input = this.getInputVector();
    this.updateDebugInfo(input, delta);
  }

  /**
   * 視窗大小變化時更新 UI 位置
   */
  private onResize(_gameSize: Phaser.Structs.Size): void {
    const anchors = getUIAnchors(this, 20);

    // 更新除錯文字位置 (右上角)
    this.debugText.setPosition(anchors.topRight.x, anchors.topRight.y);
  }

  // #region UI 設定
  private setupUI(): void {
    const anchors = getUIAnchors(this, 20);

    // 除錯文字 - 右上角
    this.debugText = this.add.text(anchors.topRight.x, anchors.topRight.y, '', {
      fontSize: '14px',
      color: '#00ff00',
      fontFamily: 'monospace',
      backgroundColor: '#000000aa',
      padding: { x: 8, y: 4 }
    }).setOrigin(1, 0).setDepth(100);
  }
  // #endregion UI 設定

  // #region 輸入處理
  private setupInput(): void {
    // 鍵盤：方向鍵
    this.cursors = this.input.keyboard!.createCursorKeys();

    // 鍵盤：WASD
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    // 觸控拖曳
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.touchTarget = new Phaser.Math.Vector2(pointer.x, pointer.y);
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown && this.touchTarget) {
        this.touchTarget.set(pointer.x, pointer.y);
      }
    });

    this.input.on('pointerup', () => {
      this.touchTarget = null;
    });
  }

  /**
   * 取得正規化的輸入向量
   * @returns {x, y} 範圍 -1 到 1
   */
  getInputVector(): Phaser.Math.Vector2 {
    let dx = 0;
    let dy = 0;

    // 鍵盤輸入優先
    if (this.cursors.left.isDown || this.wasd.A.isDown) dx = -1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) dx = 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) dy = -1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) dy = 1;

    // 如果沒有鍵盤輸入，檢查觸控
    if (dx === 0 && dy === 0 && this.touchTarget) {
      // 相對於畫面中心計算方向 (使用動態尺寸)
      const centerX = this.scale.width / 2;
      const centerY = this.scale.height / 2;
      dx = this.touchTarget.x - centerX;
      dy = this.touchTarget.y - centerY;

      // 正規化
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length > 10) {
        dx /= length;
        dy /= length;
      } else {
        dx = 0;
        dy = 0;
      }
    }

    // 對角線正規化
    if (dx !== 0 && dy !== 0) {
      const normalizer = 1 / Math.sqrt(2);
      dx *= normalizer;
      dy *= normalizer;
    }

    return new Phaser.Math.Vector2(dx, dy);
  }
  // #endregion 輸入處理

  // #region 除錯 UI
  private updateDebugInfo(input: Phaser.Math.Vector2, delta: number): void {
    const fps = Math.round(1000 / delta);
    const w = this.scale.width;
    const h = this.scale.height;
    const lines = [
      `FPS: ${fps}`,
      `Size: ${Math.round(w)}x${Math.round(h)}`,
      `Input: (${input.x.toFixed(2)}, ${input.y.toFixed(2)})`,
      `Touch: ${this.touchTarget ? 'Active' : 'None'}`,
    ];
    this.debugText.setText(lines.join('\n'));
  }
  // #endregion 除錯 UI
}
