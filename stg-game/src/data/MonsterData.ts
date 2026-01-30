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
  attackInterval: number; // 攻擊間隔 (ms)，0=特殊條件觸發
}

/**
 * 怪物定義表
 */
export const MONSTER_DEFS: MonsterDef[] = [
  {
    type: 'small',
    hp: 15,           // 15發死亡
    damage: 5,
    speed: 150,
    exp: 10,
    unitSize: 1.0,
    frameCount: 1,
    behavior: 'sine',
    attackInterval: 3000,  // 每3秒攻擊一次
  },
  {
    type: 'medium',
    hp: 50,           // 50發死亡
    damage: 10,
    speed: 100,
    exp: 25,
    unitSize: 4.0,
    frameCount: 1,
    behavior: 'dash',
    attackInterval: 0,     // 停頓時攻擊
  },
];

/**
 * 取得怪物定義
 */
export function getMonsterDef(type: string): MonsterDef | undefined {
  return MONSTER_DEFS.find(m => m.type === type);
}
