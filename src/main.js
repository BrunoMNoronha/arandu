// main.js
// Inicializa Phaser.Game e importa todas as cenas
// Dependências: Phaser, cenas, dados

import { GameData, WaveConfig } from './data/data.js';
import SplashScreenScene from './scenes/splash.js';
import CharacterSelectScene from './scenes/character-select.js';
import UIScene from './scenes/ui.js';
import DungeonScene from './scenes/dungeon.js';

const config = {
    type: Phaser.AUTO,
    input: { activePointers: 3 },
    scale: {
        mode: Phaser.Scale.RESIZE,
        parent: 'game-container',
        width: '100%',
        height: '100%'
    },
    physics: { default: 'arcade', arcade: { debug: false } },
    scene: [SplashScreenScene, CharacterSelectScene, DungeonScene, UIScene]
};

new Phaser.Game(config);
