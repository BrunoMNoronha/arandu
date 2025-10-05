import { Physics } from 'phaser';

export class AnimationSystem {
    private entity: Physics.Arcade.Sprite;

    constructor(entity: Physics.Arcade.Sprite) {
        this.entity = entity;
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