import { Scene, Physics, Tilemaps } from 'phaser';
import type { Types } from 'phaser';
import { PlayerFactory } from '../factories/PlayerFactory';
import { EnemyFactory } from '../factories/EnemyFactory';
import { MovementSystem } from '../systems/MovementSystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { EnemyAISystem } from '../systems/EnemyAISystem';
import { AttackSystem } from '../systems/AttackSystem';

export class DungeonScene extends Scene {
    private player!: Physics.Arcade.Sprite;
    private enemies!: Physics.Arcade.Group;
    private movementSystem!: MovementSystem;
    private collisionSystem!: CollisionSystem;
    private enemyAISystems: EnemyAISystem[] = [];
    private attackSystem!: AttackSystem;
    private cursors!: Types.Input.Keyboard.CursorKeys;
    private map!: Tilemaps.Tilemap;
    private wallsLayer!: Tilemaps.TilemapLayer | null;

    constructor() {
        super('DungeonScene');
    }

    public create(): void {
        // Inicia a cena de UI para manter o HUD sempre ativo junto da dungeon.
        this.scene.launch('UIScene');

        this.map = this.make.tilemap({ key: 'dungeon_map' });
        const tileset = this.map.addTilesetImage('dungeon_tiles', 'dungeon_tiles');

        if (tileset) {
            // Renderiza camadas do mapa e ativa colisão apenas onde necessário para economizar processamento.
            this.map.createLayer('Chao', tileset, 0, 0);
            this.wallsLayer = this.map.createLayer('Paredes', tileset, 0, 0);
            this.map.createLayer('Detalhes', tileset, 0, 0);
            this.wallsLayer?.setCollisionByProperty({ collides: true });
        }

        this.player = PlayerFactory.create(this, 100, 120);

        this.enemies = this.physics.add.group();
        const enemy1 = EnemyFactory.create(this, 250, 120);
        this.enemies.add(enemy1);

        if (this.wallsLayer) {
            // Mantém jogador e inimigos presos ao layout através da camada sólida.
            this.physics.add.collider(this.player, this.wallsLayer);
            this.physics.add.collider(this.enemies, this.wallsLayer);
        }

        this.cursors = this.input.keyboard!.createCursorKeys();
        this.movementSystem = new MovementSystem(this.cursors, this.player);
        this.collisionSystem = new CollisionSystem(this);
        this.collisionSystem.setupCollider(this.player, this.enemies);
        this.attackSystem = new AttackSystem(this, this.player);

        this.enemies.getChildren().forEach(enemy => {
            // Cria uma instância de IA por inimigo garantindo encapsulamento do comportamento.
            this.enemyAISystems.push(new EnemyAISystem(enemy as Physics.Arcade.Sprite, this.player));
        });

        // Alinha limites do mundo e câmera para oferecer navegação fluida.
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(this.player, true);
    }

    public update(): void {
        // Atualiza cada sistema separadamente para manter responsabilidades bem definidas.
        this.movementSystem.update();
        this.attackSystem.update(this.enemies);
        this.enemyAISystems.forEach(ai => ai.update());
    }
}