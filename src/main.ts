import Phaser from 'phaser';
import { Preloader } from './scenes/Preloader';
import { DungeonScene } from './scenes/DungeonScene';
import { UIScene } from './scenes/UIScene'; // Importa a nova cena

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 320,
  height: 240,
  scale: {
    mode: Phaser.Scale.FIT,
    parent: 'game-container',
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  pixelArt: true,
  // Adiciona a UIScene à lista de cenas do jogo
  scene: [Preloader, DungeonScene, UIScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
};

new Phaser.Game(config);