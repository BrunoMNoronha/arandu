import { Scene, Physics } from 'phaser';
import type { Types } from 'phaser';
import { PlayerFactory } from '../factories/PlayerFactory';
import { MovementSystem } from '../systems/MovementSystem';

export class DungeonScene extends Scene {
    private player!: Physics.Arcade.Sprite;
    private movementSystem!: MovementSystem;
    private cursors!: Types.Input.Keyboard.CursorKeys;

    constructor() {
        super('DungeonScene');
    }

    create() {
        this.player = PlayerFactory.create(
            this,
            this.cameras.main.centerX,
            this.cameras.main.centerY
        );

        // Correção: Usamos '!' para afirmar ao TypeScript que 'this.input.keyboard' não é nulo.
        this.cursors = this.input.keyboard!.createCursorKeys();
        
        this.movementSystem = new MovementSystem(this.cursors, this.player);
    }

    update() {
        this.movementSystem.update();
    }
}