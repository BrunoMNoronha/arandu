import Phaser from 'phaser';
import { Preloader } from './scenes/Preloader';
import { DungeonScene } from './scenes/DungeonScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  // 1. Resolução base do jogo (largura do mapa x altura do mapa)
  width: 320,  // 20 tiles * 16 pixels
  height: 240, // 15 tiles * 16 pixels
  scale: {
    // 2. Modo FIT para escalar mantendo a proporção
    mode: Phaser.Scale.FIT,
    parent: 'game-container',
    // 3. Centraliza o jogo na tela
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  // 4. Garante que os pixels fiquem nítidos ao escalar
  pixelArt: true,
  scene: [Preloader, DungeonScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
};

new Phaser.Game(config);