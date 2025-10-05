import { Scene, Physics } from 'phaser';

export class HealthComponent {
    private scene: Scene;
    private entity: Physics.Arcade.Sprite;
    private _health: number;

    constructor(scene: Scene, entity: Physics.Arcade.Sprite, initialHealth: number) {
        this.scene = scene;
        this.entity = entity;
        this._health = initialHealth;
    }

    get health(): number {
        return this._health;
    }

    public takeDamage(amount: number): void {
        this._health = Math.max(0, this._health - amount);

        // Se a entidade for o jogador, emite um evento global com a nova vida.
        if (this.entity.texture.key === 'player') {
            this.scene.game.events.emit('player-health-changed', this._health);
        }

        this.playDamageEffect();

        if (this._health === 0) {
            this.handleDeath();
        }
    }

    private playDamageEffect(): void {
        this.entity.setTint(0xff0000);
        this.scene.time.delayedCall(150, () => {
            this.entity.clearTint();
        });
    }

    private handleDeath(): void {
        if (this.entity.body instanceof Physics.Arcade.Body) {
            this.entity.body.enable = false;
        }

        this.scene.add.tween({
            targets: this.entity,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                this.entity.destroy();
            }
        });
    }
}