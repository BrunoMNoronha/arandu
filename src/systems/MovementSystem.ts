import { Physics } from 'phaser';
import type { Types } from 'phaser';
import { AnimationSystem } from './AnimationSystem';
import { ConfigService } from '../config/ConfigService';

export class MovementSystem {
    private cursors: Types.Input.Keyboard.CursorKeys;
    private player: Physics.Arcade.Sprite;
    private animationSystem: AnimationSystem;
    private readonly playerSpeed: number;

    constructor(cursors: Types.Input.Keyboard.CursorKeys, player: Physics.Arcade.Sprite) {
        this.cursors = cursors;
        this.player = player;
        this.animationSystem = new AnimationSystem(this.player);
        this.playerSpeed = ConfigService.getInstance().getCharacterConfig().movementSpeed;
    }

    public update(): void {
        const input: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);

        if (this.cursors.left.isDown) {
            input.x -= 1;
        } else if (this.cursors.right.isDown) {
            input.x += 1;
        }

        if (this.cursors.up.isDown) {
            input.y -= 1;
        } else if (this.cursors.down.isDown) {
            input.y += 1;
        }

        if (input.lengthSq() > 0) {
            input.normalize().scale(this.playerSpeed);
        }

        this.player.setVelocity(input.x, input.y);
        this.animationSystem.update();
    }
}