import { Scene, Physics, Tilemaps } from 'phaser';
import type { Types } from 'phaser';
import { PlayerFactory } from '../factories/PlayerFactory';
import { EnemyFactory } from '../factories/EnemyFactory';
import { MovementSystem } from '../systems/MovementSystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { EnemyAISystem } from '../systems/EnemyAISystem';

export class DungeonScene extends Scene {
    private player!: Physics.Arcade.Sprite;
    private enemy!: Physics.Arcade.Sprite;
    private movementSystem!: MovementSystem;
    private collisionSystem!: CollisionSystem;
    private enemyAISystem!: EnemyAISystem;
    private cursors!: Types.Input.Keyboard.CursorKeys;
    private map!: Tilemaps.Tilemap;
    private wallsLayer!: Tilemaps.TilemapLayer | null;

    constructor() {
        super('DungeonScene');
    }

    create() {
        // Inicia a cena da UI em paralelo
        this.scene.launch('UIScene');

        // --- CRIAÇÃO DO MAPA ---
        this.map = this.make.tilemap({ key: 'dungeon_map' });
        const tileset = this.map.addTilesetImage('dungeon_tiles', 'dungeon_tiles');
        
        if (tileset) {
            this.map.createLayer('Chao', tileset, 0, 0);
            this.wallsLayer = this.map.createLayer('Paredes', tileset, 0, 0);
            this.map.createLayer('Detalhes', tileset, 0, 0);
            this.wallsLayer?.setCollisionByProperty({ collides: true });
        }

        // --- CRIAÇÃO DE PERSONAGENS ---
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
        this.enemyAISystem = new EnemyAISystem(this.enemy);

        // --- CÂMERA E LIMITES DO MUNDO ---
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(this.player, true);
    }

    update() {
        this.movementSystem.update();
        this.enemyAISystem.update();
    }
}