import Phaser from 'phaser';
import { Preloader } from './scenes/Preloader';
import { DungeonScene } from './scenes/DungeonScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.RESIZE,
    parent: 'game-container',
    width: '100%',
    height: '100%',
  },
  // Registra as cenas do jogo
  scene: [Preloader, DungeonScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
};

// Inicia o jogo
new Phaser.Game(config);