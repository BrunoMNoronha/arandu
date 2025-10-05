import { Scene, Physics, Tilemaps } from 'phaser';
import type { Types } from 'phaser';
import { PlayerFactory } from '../factories/PlayerFactory';
import { EnemyFactory } from '../factories/EnemyFactory';
import { MovementSystem } from '../systems/MovementSystem';
import { CollisionSystem } from '../systems/CollisionSystem';

export class DungeonScene extends Scene {
    private player!: Physics.Arcade.Sprite;
    private enemy!: Physics.Arcade.Sprite; 
    private movementSystem!: MovementSystem;
    private collisionSystem!: CollisionSystem;
    private cursors!: Types.Input.Keyboard.CursorKeys;
    private map!: Tilemaps.Tilemap;
    private wallsLayer!: Tilemaps.TilemapLayer | null;

    constructor() {
        super('DungeonScene');
    }

    create() {
        // --- CRIAÇÃO DO MAPA ---
        this.map = this.make.tilemap({ key: 'dungeon_map' });
        // O 1º argumento é o nome do tileset no editor Tiled, o 2º é a key do asset carregado no Preloader.
        const tileset = this.map.addTilesetImage('dungeon_tiles', 'dungeon_tiles');
        
        if (tileset) {
            this.map.createLayer('Chao', tileset, 0, 0); // Camada de chão, sem colisão
            this.wallsLayer = this.map.createLayer('Paredes', tileset, 0, 0); // Camada de paredes
            this.map.createLayer('Detalhes', tileset, 0, 0); // Camada de detalhes visuais
            this.wallsLayer?.setCollisionByProperty({ collides: true });
        }

        // --- CRIAÇÃO DE PERSONAGENS ---
        // Posição inicial em uma área aberta do mapa
        this.player = PlayerFactory.create(this, 100, 120);
        this.enemy = EnemyFactory.create(this, 250, 120);

        // --- CONFIGURAÇÃO DE FÍSICA E COLISÃO COM O MAPA ---
        if (this.wallsLayer) {
            this.physics.add.collider(this.player, this.wallsLayer);
            this.physics.add.collider(this.enemy, this.wallsLayer);
        }

        // --- SISTEMAS ---
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.movementSystem = new MovementSystem(this.cursors, this.player);
        this.collisionSystem = new CollisionSystem(this);
        this.collisionSystem.setupCollider(this.player, this.enemy);

        // --- CÂMERA E LIMITES DO MUNDO ---
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(this.player, true);
    }

    update() {
        this.movementSystem.update();
    }
}