import { Physics } from 'phaser';
import type { Types } from 'phaser';
import { AnimationSystem } from './AnimationSystem';

const PLAYER_SPEED = 100;

export class MovementSystem {
    private cursors: Types.Input.Keyboard.CursorKeys;
    private player: Physics.Arcade.Sprite;
    private animationSystem: AnimationSystem;

    constructor(cursors: Types.Input.Keyboard.CursorKeys, player: Physics.Arcade.Sprite) {
        this.cursors = cursors;
        this.player = player;
        this.animationSystem = new AnimationSystem(this.player);
    }

    public update(): void {
        this.player.setVelocity(0);

        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-PLAYER_SPEED);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(PLAYER_SPEED);
        }

        if (this.cursors.up.isDown) {
            this.player.setVelocityY(-PLAYER_SPEED);
        } else if (this.cursors.down.isDown) {
            this.player.setVelocityY(PLAYER_SPEED);
        }

        this.animationSystem.update();
    }
}