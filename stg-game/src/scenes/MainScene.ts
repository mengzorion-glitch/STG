import Phaser from 'phaser';
import { getUIAnchors } from '../config/GameConfig';
import { ParallaxBackground } from '../systems/ParallaxBackground';
import { MonsterSystem } from '../systems/MonsterSystem';
import { BulletSystem } from '../systems/BulletSystem';
import { ItemSystem } from '../systems/ItemSystem';
import { Player } from '../entities/Player';
import { PlayerHUD } from '../ui/PlayerHUD';
import { GameOverScreen } from '../ui/GameOverScreen';
import { loadPlayerAssets } from '../utils/AssetLoader';
import type { AnimationConfig } from '../utils/AssetLoader';

/**
 * 主遊戲場景
 * V0.1.0: 基礎框架與輸入系統
 * V0.2.0: 視差背景系統
 * V0.3.0: 角色系統
 * V0.4.0: 怪物系統
 * V0.5.0: 子彈系統
 * V0.6.0: 技能數值系統 & UI
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

  // #region 道具系統
  private itemSystem!: ItemSystem;
  // #endregion 道具系統

  // #region 角色系統
  private player!: Player;
  private playerAnimConfig: AnimationConfig[] = [
    { key: 'idle', frameCount: 3 },
    { key: 'attack', frameCount: 2 },
    { key: 'hurt', frameCount: 1 },
  ];
  // #endregion 角色系統

  // #region V0.6.0: 遊戲狀態
  private hud!: PlayerHUD;
  private survivalTime: number = 0;
  private isGameOver: boolean = false;
  private collisionCooldown: number = 0;
  private readonly COLLISION_COOLDOWN = 500; // 碰撞無敵時間 (ms)

  // 大技能旋轉掃射
  private ultAngle: number = 0;
  private ultFireTimer: number = 0;
  private readonly ULT_FIRE_INTERVAL = 50;  // 發射間隔 (ms)
  private readonly ULT_ANGLE_STEP = 10;      // 每輪旋轉角度
  private readonly ULT_DIRECTIONS = 8;       // 8 方向

  // BOSS 技能狀態
  private bossSpiralAngle: number = 0;
  private bossWaveTimer: number = 0;
  private bossWaveCount: number = 0;
  private isBossWaveActive: boolean = false;
  // #endregion V0.6.0

  constructor() {
    super('MainScene');
  }

  /**
   * V0.6.0: 場景初始化 (重新開始時呼叫)
   */
  init(): void {
    this.isLeftDown = false;
    this.fireTimer = 0;
    this.survivalTime = 0;
    this.isGameOver = false;
    this.collisionCooldown = 0;
    this.ultAngle = 0;
    this.ultFireTimer = 0;
    this.bossSpiralAngle = 0;
    this.bossWaveTimer = 0;
    this.bossWaveCount = 0;
    this.isBossWaveActive = false;
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

    // 初始化道具系統
    this.itemSystem = new ItemSystem(this);

    // 設定怪物攻擊回呼
    this.monsterSystem.setAttackCallback((monster, type) => {
      if (type === 'circle') {
        // 小怪: 8發環形
        this.bulletSystem.fireCircle(monster.x, monster.y, 8);
      } else if (type === 'fan') {
        // 中怪: 扇形 160度 8發
        this.bulletSystem.fireFan(monster.x, monster.y, 160, 8);
      } else if (type === 'boss_spiral') {
        // BOSS 螺旋彈幕
        this.bulletSystem.fireBossSpiral(monster.x, monster.y, this.bossSpiralAngle);
        this.bossSpiralAngle += 15;
      } else if (type === 'boss_burst') {
        // BOSS 爆發彈幕
        this.bulletSystem.fireBossBurst(monster.x, monster.y);
      } else if (type === 'boss_wave') {
        // BOSS 波浪彈幕 - 啟動連續發射
        this.isBossWaveActive = true;
        this.bossWaveCount = 0;
        this.bossWaveTimer = 0;
      }
    });

    // V0.6.0: 初始化 HUD
    this.hud = new PlayerHUD(this);

    this.setupInput();
    this.setupUI();

    // 監聽視窗大小變化
    this.scale.on('resize', this.onResize, this);
  }

  update(_time: number, delta: number): void {
    // V0.6.0: 遊戲結束時停止更新
    if (this.isGameOver) return;

    // V0.6.0: 累計存活時間
    this.survivalTime += delta / 1000;

    // V0.2.0: 更新背景捲動
    this.parallaxBg.update(delta);

    // V0.3.0: 更新角色
    this.player.update(delta);

    // V0.6.0: 更新能量消耗
    this.player.updateEnergy(delta);

    // V0.4.0: 更新怪物
    this.monsterSystem.update(delta);

    // BOSS 波浪彈幕更新
    if (this.isBossWaveActive) {
      this.bossWaveTimer += delta;
      if (this.bossWaveTimer >= 150 && this.bossWaveCount < 5) {
        this.bossWaveTimer = 0;
        // 找到 BOSS 並發射波浪
        const monsters = this.monsterSystem.getMonsters();
        const boss = monsters.find(m => m.getType() === 'boss');
        if (boss) {
          this.bulletSystem.fireBossWave(boss.x, boss.y, this.bossWaveCount);
        }
        this.bossWaveCount++;
        if (this.bossWaveCount >= 5) {
          this.isBossWaveActive = false;
        }
      }
    }

    // 30秒後生成 BOSS
    if (this.survivalTime >= 30 && !this.monsterSystem.hasBoss()) {
      this.monsterSystem.spawnBoss();
    }

    // V0.5.0: 更新子彈
    this.bulletSystem.update(delta);

    // 更新道具
    this.itemSystem.update(delta);

    // 檢查道具拾取
    const pickedItem = this.itemSystem.checkPlayerPickup(this.player);
    if (pickedItem === 'bullet_up') {
      if (this.player.isMaxBulletCount()) {
        // 已達最大彈數，改為增加能量
        this.player.addEnergy(50);
      } else {
        this.player.addBulletCount(1);
      }
    }

    // V0.6.0: 大技能旋轉掃射
    if (this.player.isUltimateActive()) {
      this.ultFireTimer += delta;
      while (this.ultFireTimer >= this.ULT_FIRE_INTERVAL) {
        this.ultFireTimer -= this.ULT_FIRE_INTERVAL;
        const angleStep = 360 / this.ULT_DIRECTIONS;
        for (let i = 0; i < this.ULT_DIRECTIONS; i++) {
          const angle = this.ultAngle + angleStep * i;
          this.bulletSystem.fireUltimate(this.player.x, this.player.y, angle);
        }
        this.ultAngle += this.ULT_ANGLE_STEP;
        if (this.ultAngle >= 360) this.ultAngle -= 360;
      }
    }

    // V0.5.0: 左鍵按住 = 連續發射 + 攻擊狀態
    if (this.isLeftDown) {
      this.fireTimer += delta;
      if (this.fireTimer >= this.FIRE_INTERVAL) {
        this.fireTimer = 0;
        // 從玩家前方發射
        this.bulletSystem.firePlayerSpread(this.player.x + 30, this.player.y, this.player.getBulletCount());
        this.player.setPlayerState('attack');
      }
    } else {
      this.fireTimer = this.FIRE_INTERVAL; // 下次按下立即發射
      if (this.player.getState() === 'attack') {
        this.player.setPlayerState('idle');
      }
    }

    // V0.5.0 & V0.6.0: 碰撞檢測
    this.checkCollisions();

    // V0.6.0: 怪物碰撞 (帶冷卻)
    if (this.collisionCooldown > 0) {
      this.collisionCooldown -= delta;
    } else if (this.monsterSystem.checkPlayerCollision(this.player)) {
      this.collisionCooldown = this.COLLISION_COOLDOWN;
    }

    // V0.6.0: 更新 HUD
    this.hud.updateHP(this.player.getHP(), this.player.getMaxHP());
    this.hud.updateEnergy(this.player.getEnergy(), this.player.getMaxEnergy());

    // V0.6.0: 檢查死亡
    if (this.player.isDead()) {
      this.gameOver();
    }

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
    const ultimateBullets = this.bulletSystem.getUltimateBullets();

    // V0.6.0: 大技能金色子彈 vs 敵方彈幕 (打消)
    for (const ultBullet of ultimateBullets) {
      for (const mobBullet of monsterBullets) {
        const dist = Phaser.Math.Distance.Between(
          ultBullet.x, ultBullet.y,
          mobBullet.x, mobBullet.y
        );
        const hitRadius = ultBullet.getRadius() + mobBullet.getRadius();
        if (dist < hitRadius) {
          // 金色子彈打消敵方彈幕，但金色子彈不消失
          this.bulletSystem.removeBullet(mobBullet);
        }
      }
    }

    // 玩家子彈 vs 怪物
    for (const bullet of playerBullets) {
      for (const monster of monsters) {
        if (!monster.isAlive()) continue;
        const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, monster.x, monster.y);
        const hitRadius = bullet.getRadius() + monster.getRadius();
        if (dist < hitRadius) {
          const monsterX = monster.x;
          const monsterY = monster.y;
          const killed = monster.takeDamage(bullet.getDamage());
          this.bulletSystem.removeBullet(bullet);
          // V0.6.0: 擊中敵人 +1 能量
          this.player.addEnergy(1);
          if (killed) {
            this.monsterSystem.removeMonster(monster);
            // 所有怪物掉落道具
            this.itemSystem.spawn(monsterX, monsterY, 'bullet_up');
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
        this.player.takeBulletDamage();
        this.bulletSystem.removeBullet(bullet);
      }
    }
  }
  // #endregion 碰撞檢測

  // #region V0.6.0: 遊戲結束
  private gameOver(): void {
    this.isGameOver = true;
    new GameOverScreen(this, this.survivalTime);
  }
  // #endregion

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
      if (this.isGameOver) return;
      if (pointer.leftButtonDown()) {
        this.isLeftDown = true;
        this.player.setTargetPosition(new Phaser.Math.Vector2(pointer.x, pointer.y));
      }
      if (pointer.rightButtonDown()) {
        this.onRightClick();
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isGameOver) return;
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
   * V0.6.0: 右鍵施放大技能
   */
  private onRightClick(): void {
    if (this.player.activateUlt()) {
      this.ultAngle = 0;
      this.ultFireTimer = 0;
    }
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
      `HP: ${this.player.getHP()}/${this.player.getMaxHP()}`,
      `Energy: ${Math.floor(this.player.getEnergy())}/${this.player.getMaxEnergy()}`,
      `Monsters: ${monsterCount}`,
      `Bullets: ${bulletCount}`,
    ];
    this.debugText.setText(lines.join('\n'));
  }
  // #endregion 除錯 UI
}
