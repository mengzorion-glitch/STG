import Phaser from 'phaser';
import './style.css';
import { GameConfig } from './config/GameConfig';
import { StartScene } from './scenes/StartScene';
import { MainScene } from './scenes/MainScene';

// V0.1.0: 整合場景與設定
const config: Phaser.Types.Core.GameConfig = {
  ...GameConfig,
  scene: [StartScene, MainScene]
};

window.addEventListener('load', () => {
  new Phaser.Game(config);
});
