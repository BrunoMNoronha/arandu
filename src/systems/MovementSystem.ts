import { Physics } from 'phaser';
import type { Types } from 'phaser';
import { AnimationSystem } from './AnimationSystem';
import type { PlayerStats } from '../config/types';

export class MovementSystem {
    private cursors: Types.Input.Keyboard.CursorKeys;
    private player: Physics.Arcade.Sprite;
    private animationSystem: AnimationSystem;
    private readonly playerStats: PlayerStats;
    private readonly playerSpeed: number;

    constructor(cursors: Types.Input.Keyboard.CursorKeys, player: Physics.Arcade.Sprite) {
        this.cursors = cursors;
        this.player = player;
        this.animationSystem = new AnimationSystem(this.player);
        this.playerStats = this.extractStats(player);
        this.playerSpeed = this.playerStats.movementSpeed;
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

    private extractStats(player: Physics.Arcade.Sprite): PlayerStats {
        const stats = player.getData('stats') as PlayerStats | undefined;
        if (!stats) {
            throw new Error('PlayerStats não inicializados no sprite do jogador.');
        }

        return stats;
    }
}