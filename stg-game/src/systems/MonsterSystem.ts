import Phaser from 'phaser';
import { Monster } from '../entities/Monster';
import type { AttackCallback } from '../entities/Monster';
import { MONSTER_DEFS } from '../data/MonsterData';
import type { MonsterDef } from '../data/MonsterData';

/**
 * 怪物生成與管理系統
 */
export class MonsterSystem {
  private scene: Phaser.Scene;
  private monsters: Monster[] = [];
  private spawnTimer: number = 0;
  private spawnInterval: number = 2000; // 生成間隔 (ms)
  private attackCallback: AttackCallback | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * 設定怪物攻擊回呼
   */
  setAttackCallback(callback: AttackCallback): void {
    this.attackCallback = callback;
  }

  /**
   * 載入怪物資源
   */
  static preload(scene: Phaser.Scene): void {
    for (const def of MONSTER_DEFS) {
      for (let i = 0; i < def.frameCount; i++) {
        scene.load.image(
          `mob-${def.type}-${i}`,
          `monster/mob_${def.type}_${i}.png`
        );
      }
    }
  }

  /**
   * 每幀更新
   */
  update(delta: number): void {
    // 生成計時
    this.spawnTimer += delta;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnRandom();
    }

    // 更新所有怪物
    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const monster = this.monsters[i];
      monster.update(delta);

      // 視野外剔除 (離開畫面左側)
      if (monster.x < -100) {
        monster.destroy();
        this.monsters.splice(i, 1);
      }
    }
  }

  /**
   * 隨機生成怪物
   */
  private spawnRandom(): void {
    const def = MONSTER_DEFS[Math.floor(Math.random() * MONSTER_DEFS.length)];
    this.spawn(def);
  }

  /**
   * 生成指定類型怪物
   */
  spawn(def: MonsterDef): Monster {
    const screenW = this.scene.scale.width;
    const screenH = this.scene.scale.height;
    const x = screenW + 50;  // 畫面右側外
    const y = Phaser.Math.Between(100, screenH - 100);

    const monster = new Monster(this.scene, x, y, def);
    if (this.attackCallback) {
      monster.setAttackCallback(this.attackCallback);
    }
    this.monsters.push(monster);
    return monster;
  }

  /**
   * 取得所有存活怪物
   */
  getMonsters(): Monster[] {
    return this.monsters.filter(m => m.isAlive());
  }

  /**
   * 移除怪物
   */
  removeMonster(monster: Monster): void {
    const index = this.monsters.indexOf(monster);
    if (index !== -1) {
      this.monsters.splice(index, 1);
    }
  }

  /**
   * 設定生成間隔
   */
  setSpawnInterval(ms: number): void {
    this.spawnInterval = ms;
  }

  /**
   * 清除所有怪物
   */
  destroy(): void {
    for (const monster of this.monsters) {
      monster.destroy();
    }
    this.monsters = [];
  }
}
