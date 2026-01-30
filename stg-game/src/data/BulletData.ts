/**
 * 子彈定義
 */
export interface BulletDef {
  key: string;        // 圖片key前綴
  speed: number;      // 速度 (px/s)
  damage: number;     // 傷害
  size: number;       // 碰撞半徑
  unitSize: number;   // 單位大小 (0=不縮放)
  frameCount: number; // 動畫幀數
}

export const PLAYER_BULLET: BulletDef = {
  key: 'player-bullet',
  speed: 800,
  damage: 1,
  size: 10,
  unitSize: 0,  // 不縮放，使用原始大小
  frameCount: 2,
};

export const MOB_BULLET: BulletDef = {
  key: 'mob-bullet',
  speed: 300,
  damage: 1,
  size: 16,
  unitSize: 0.6,
  frameCount: 1,
};

// V0.6.0: 大技能金色子彈
export const ULTIMATE_BULLET: BulletDef = {
  key: 'player-bullet',  // 使用同樣的圖片，會染成金色
  speed: 1200,           // 高速
  damage: 3,             // 3 點傷害
  size: 24,
  unitSize: 0.5,         // 放大 1 倍
  frameCount: 2,
};
