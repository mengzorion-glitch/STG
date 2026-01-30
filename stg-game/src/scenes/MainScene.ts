import Phaser from 'phaser';
import { getUIAnchors } from '../config/GameConfig';
import { ParallaxBackground } from '../systems/ParallaxBackground';
import { MonsterSystem } from '../systems/MonsterSystem';
import { BulletSystem } from '../systems/BulletSystem';
import { Player } from '../entities/Player';
import { loadPlayerAssets } from '../utils/AssetLoader';
import type { AnimationConfig } from '../utils/AssetLoader';

/**
 * 主遊戲場景
 * V0.1.0: 基礎框架與輸入系統
 * V0.2.0: 視差背景系統
 * V0.3.0: 角色系統
 * V0.4.0: 怪物系統
 * V0.5.0: 子彈系統
 */
export class MainScene extends Phaser.Scene {
  // #region 輸入系統
  private isLeftDown: boolean = false;
  private fireTimer: number = 0;
  private readonly FIRE_INTERVAL = 200; // 0.2秒
  // #endregion 輸入系統

  // #region 除錯顯示
  private debugText!: Phaser.GameObjects.Text;
  // #endregion 除錯顯示

  // #region 背景系統
  private parallaxBg!: ParallaxBackground;
  // #endregion 背景系統

  // #region 怪物系統
  private monsterSystem!: MonsterSystem;
  // #endregion 怪物系統

  // #region 子彈系統
  private bulletSystem!: BulletSystem;
  // #endregion 子彈系統

  // #region 角色系統
  private player!: Player;
  private playerAnimConfig: AnimationConfig[] = [
    { key: 'idle', frameCount: 3 },
    { key: 'attack', frameCount: 2 },
    { key: 'hurt', frameCount: 1 },
  ];
  // #endregion 角色系統

  constructor() {
    super('MainScene');
  }

  preload(): void {
    // V0.2.0: 載入背景圖片
    this.load.image('bg_far', 'images/bg_far.png');
    this.load.image('bg_mid', 'images/bg_mid.png');

    // V0.3.0: 載入角色圖片
    loadPlayerAssets(this, 'player', this.playerAnimConfig);

    // V0.4.0: 載入怪物圖片
    MonsterSystem.preload(this);

    // V0.5.0: 載入子彈圖片
    BulletSystem.preload(this);
  }

  create(): void {
    // V0.2.0: 初始化視差背景 (最先建立，確保在最底層)
    this.parallaxBg = new ParallaxBackground(this);
    this.parallaxBg.addLayer('bg_far', 0.1, 0);  // 遠景，慢
    this.parallaxBg.addLayer('bg_mid', 0.6, 1);  // 中景，中速

    // V0.3.0: 建立玩家角色 (畫面左側中央)
    const frameConfig: { [key: string]: number } = {};
    for (const anim of this.playerAnimConfig) {
      frameConfig[anim.key] = anim.frameCount;
    }
    this.player = new Player(this, 300, this.scale.height / 2);
    this.player.initAnimations(frameConfig);

    // V0.4.0: 初始化怪物系統
    this.monsterSystem = new MonsterSystem(this);

    // V0.5.0: 初始化子彈系統
    this.bulletSystem = new BulletSystem(this);

    // 設定怪物攻擊回呼
    this.monsterSystem.setAttackCallback((monster, type) => {
      if (type === 'circle') {
        // 小怪: 8發環形
        this.bulletSystem.fireCircle(monster.x, monster.y, 8);
      } else if (type === 'fan') {
        // 中怪: 扇形 160度 8發
        this.bulletSystem.fireFan(monster.x, monster.y, 160, 8);
      }
    });

    this.setupInput();
    this.setupUI();

    // 監聽視窗大小變化
    this.scale.on('resize', this.onResize, this);
  }

  update(_time: number, delta: number): void {
    // V0.2.0: 更新背景捲動
    this.parallaxBg.update(delta);

    // V0.3.0: 更新角色
    this.player.update(delta);

    // V0.4.0: 更新怪物
    this.monsterSystem.update(delta);

    // V0.5.0: 更新子彈
    this.bulletSystem.update(delta);

    // V0.5.0: 左鍵按住 = 連續發射 + 攻擊狀態
    if (this.isLeftDown) {
      this.fireTimer += delta;
      if (this.fireTimer >= this.FIRE_INTERVAL) {
        this.fireTimer = 0;
        // 從玩家前方發射
        this.bulletSystem.firePlayerSpread(this.player.x + 30, this.player.y);
        this.player.setPlayerState('attack');
      }
    } else {
      this.fireTimer = this.FIRE_INTERVAL; // 下次按下立即發射
      if (this.player.getState() === 'attack') {
        this.player.setPlayerState('idle');
      }
    }

    // V0.5.0: 碰撞檢測
    this.checkCollisions();

    // 更新除錯資訊
    this.updateDebugInfo(delta);
  }

  // #region 碰撞檢測
  /**
   * 碰撞檢測
   */
  private checkCollisions(): void {
    const monsters = this.monsterSystem.getMonsters();
    const playerBullets = this.bulletSystem.getPlayerBullets();
    const monsterBullets = this.bulletSystem.getMonsterBullets();

    // 玩家子彈 vs 怪物
    for (const bullet of playerBullets) {
      for (const monster of monsters) {
        if (!monster.isAlive()) continue;
        const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, monster.x, monster.y);
        const hitRadius = bullet.getRadius() + monster.getRadius();
        if (dist < hitRadius) {
          const killed = monster.takeDamage(bullet.getDamage());
          this.bulletSystem.removeBullet(bullet);
          if (killed) {
            this.monsterSystem.removeMonster(monster);
          }
          break;
        }
      }
    }

    // 怪物子彈 vs 玩家
    for (const bullet of monsterBullets) {
      const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, this.player.x, this.player.y);
      const hitRadius = bullet.getRadius() + this.player.getRadius();
      if (dist < hitRadius) {
        this.player.takeDamage(bullet.getDamage());
        this.bulletSystem.removeBullet(bullet);
      }
    }
  }
  // #endregion 碰撞檢測

  /**
   * 視窗大小變化時更新 UI 位置
   */
  private onResize(_gameSize: Phaser.Structs.Size): void {
    const anchors = getUIAnchors(this, 20);
    this.debugText.setPosition(anchors.topRight.x, anchors.topRight.y);
  }

  // #region UI 設定
  private setupUI(): void {
    const anchors = getUIAnchors(this, 20);

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
    // 停用右鍵選單
    this.input.mouse!.disableContextMenu();

    // 滑鼠/觸控：左鍵按下 = 移動 + 攻擊
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        this.isLeftDown = true;
        this.player.setTargetPosition(new Phaser.Math.Vector2(pointer.x, pointer.y));
      }
      if (pointer.rightButtonDown()) {
        this.onRightClick();
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isLeftDown && pointer.leftButtonDown()) {
        this.player.setTargetPosition(new Phaser.Math.Vector2(pointer.x, pointer.y));
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.leftButtonDown()) {
        this.isLeftDown = false;
        this.player.setTargetPosition(null);
      }
    });
  }

  /**
   * 右鍵施放技能
   */
  private onRightClick(): void {
    // TODO: V0.6.0 施放技能
    console.log('Right click - Skill cast');
  }
  // #endregion 輸入處理

  // #region 除錯 UI
  private updateDebugInfo(delta: number): void {
    const fps = Math.round(1000 / delta);
    const w = this.scale.width;
    const h = this.scale.height;
    const monsterCount = this.monsterSystem.getMonsters().length;
    const bulletCount = this.bulletSystem.getBulletCount();
    const lines = [
      `FPS: ${fps}`,
      `Size: ${Math.round(w)}x${Math.round(h)}`,
      `Player: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`,
      `State: ${this.player.getState()}`,
      `Monsters: ${monsterCount}`,
      `Bullets: ${bulletCount}`,
    ];
    this.debugText.setText(lines.join('\n'));
  }
  // #endregion 除錯 UI
}
