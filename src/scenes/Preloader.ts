import { Scene } from 'phaser';

export class Preloader extends Scene {
    constructor() {
        super('Preloader');
    }

    public preload(): void {
        // Carrega o atlas de animação do jogador
        this.load.atlas('player', 'assets/player_spritesheet.png', 'assets/player_atlas.json');
        
        // Assets existentes
        this.load.image('enemy', 'assets/enemy.png');

        // --- ASSETS DO MAPA ---
        this.load.image('dungeon_tiles', 'assets/dungeon_tiles.png');
        this.load.tilemapTiledJSON('dungeon_map', 'assets/dungeon_map.json');
    }

    public create(): void {
        this.scale.refresh();
        this.scene.start('DungeonScene');
    }
}
