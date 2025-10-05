import Phaser from 'phaser';

// Por enquanto, uma cena vazia apenas para teste
class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }
  create() {
    // A tela preta do jogo será renderizada aqui
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.RESIZE,
    parent: 'game-container',
    width: '100%',
    height: '100%',
  },
  scene: [GameScene], // Adicionamos nossa cena de teste
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
};

// Inicia o jogo
new Phaser.Game(config);