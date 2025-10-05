import { Physics } from 'phaser';
// Correção: Importando 'Types' como um tipo.
import type { Types } from 'phaser';

const PLAYER_SPEED = 200;

export class MovementSystem {
    private cursors: Types.Input.Keyboard.CursorKeys;
    private player: Physics.Arcade.Sprite;

    constructor(cursors: Types.Input.Keyboard.CursorKeys, player: Physics.Arcade.Sprite) {
        this.cursors = cursors;
        this.player = player;
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
    }
}