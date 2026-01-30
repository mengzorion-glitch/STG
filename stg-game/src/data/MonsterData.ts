/**
 * 行為模式
 */
export type BehaviorType = 'straight' | 'sine' | 'dash';

/**
 * 怪物定義
 */
export interface MonsterDef {
  type: string;         // 類型 ID
  hp: number;           // 血量
  damage: number;       // 碰撞傷害
  speed: number;        // 移動速度 (px/s)
  exp: number;          // 經驗值
  unitSize: number;     // 單位大小
  frameCount: number;   // 動畫幀數
  behavior: BehaviorType; // 行為模式
}

/**
 * 怪物定義表
 */
export const MONSTER_DEFS: MonsterDef[] = [
  {
    type: 'small',
    hp: 20,
    damage: 5,
    speed: 150,
    exp: 10,
    unitSize: 0.5,
    frameCount: 1,
    behavior: 'sine',
  },
  {
    type: 'medium',
    hp: 50,
    damage: 10,
    speed: 100,
    exp: 25,
    unitSize: 1.5,
    frameCount: 1,
    behavior: 'dash',
  },
];

/**
 * 取得怪物定義
 */
export function getMonsterDef(type: string): MonsterDef | undefined {
  return MONSTER_DEFS.find(m => m.type === type);
}
