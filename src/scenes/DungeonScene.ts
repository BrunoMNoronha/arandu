import { Scene, Physics, Tilemaps } from 'phaser';
import type { Types } from 'phaser';
import { PlayerFactory } from '../factories/PlayerFactory';
import { MovementSystem } from '../systems/MovementSystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { AttackSystem } from '../systems/AttackSystem';
import { DamageTextManager } from '../components/DamageTextManager';
import { WaveManager } from '../systems/WaveManager';

export class DungeonScene extends Scene {
    private player!: Physics.Arcade.Sprite;
    private enemies!: Physics.Arcade.Group;
    private movementSystem!: MovementSystem;
    private collisionSystem!: CollisionSystem;
    private attackSystem!: AttackSystem;
    private cursors!: Types.Input.Keyboard.CursorKeys;
    private map!: Tilemaps.Tilemap;
    private wallsLayer!: Tilemaps.TilemapLayer | null;
    private damageTextManager!: DamageTextManager;
    private waveManager!: WaveManager;

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

        this.damageTextManager = new DamageTextManager(this);

        this.player = PlayerFactory.create(this, 100, 120, this.damageTextManager);

        this.enemies = this.physics.add.group();

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

        this.waveManager = new WaveManager(this, this.player, this.enemies, this.damageTextManager);
        this.waveManager.start();

        // Alinha limites do mundo e câmera para oferecer navegação fluida.
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(this.player, true);
    }

    public update(): void {
        // Atualiza cada sistema separadamente para manter responsabilidades bem definidas.
        this.movementSystem.update();
        this.attackSystem.update(this.enemies);
        this.waveManager.update();
    }
}