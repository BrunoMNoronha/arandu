import { Scene } from 'phaser';

export class Preloader extends Scene {
    constructor() {
        super('Preloader');
    }

    preload() {
        // Assets existentes
        this.load.image('player', 'assets/player.png');
        this.load.image('enemy', 'assets/enemy.png');

        // --- ASSETS DO MAPA ---
        this.load.image('dungeon_tiles', 'assets/dungeon_tiles.png');
        this.load.tilemapTiledJSON('dungeon_map', 'assets/dungeon_map.json');
    }

    create() {
        this.scene.start('DungeonScene');
    }
}