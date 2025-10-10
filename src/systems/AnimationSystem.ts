import { Physics } from 'phaser';

export class AnimationSystem {
    private entity: Physics.Arcade.Sprite;
    private baseMovementSpeed: number | null = null;

    constructor(entity: Physics.Arcade.Sprite) {
        this.entity = entity;
    }

    public setBaseMovementSpeed(speed: number): void {
        this.baseMovementSpeed = speed;
    }

    public onMovementSpeedChanged(newSpeed: number): void {
        if (!this.entity.anims) {
            return;
        }

        if (!this.baseMovementSpeed || this.baseMovementSpeed <= 0) {
            this.baseMovementSpeed = newSpeed;
        }

        const normalizedSpeed: number = Math.max(0.1, newSpeed / this.baseMovementSpeed);
        this.entity.anims.timeScale = normalizedSpeed;
    }

    public update(): void {
        if (!this.entity.body) return;

        const velocity = this.entity.body.velocity;

        if (velocity.x !== 0 || velocity.y !== 0) {
            this.entity.anims.play('player-walk', true);
        } else {
            this.entity.anims.play('player-idle', true);
        }

        // Vira o sprite com base na direção do movimento
        if (velocity.x < 0) {
            this.entity.setFlipX(true);
        } else if (velocity.x > 0) {
            this.entity.setFlipX(false);
        }
    }
}