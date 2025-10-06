import { Scene, Physics } from 'phaser';

// Encapsula regras de vida e feedback visual, facilitando reuso em diferentes entidades.
export class HealthComponent {
    private readonly scene: Scene;
    private readonly entity: Physics.Arcade.Sprite;
    private readonly maxHealth: number;
    private _health: number;
    private damageTween: Phaser.Tweens.Tween | null = null;

    // Recebe todas as dependências via construtor para manter o componente independente.
    constructor(scene: Scene, entity: Physics.Arcade.Sprite, initialHealth: number) {
        this.scene = scene;
        this.entity = entity;
        this._health = initialHealth;
        this.maxHealth = initialHealth;

        // Emite o valor inicial garantindo que UI e sistemas fiquem sincronizados desde o spawn.
        this.emitHealthChanged();
    }

    public get health(): number {
        return this._health;
    }

    public get max(): number {
        return this.maxHealth;
    }

    public isAlive(): boolean {
        return this._health > 0;
    }

    // Permite recuperar vida, prolongando a sobrevivência do ator.
    public heal(amount: number): void {
        if (amount <= 0 || !this.isAlive()) {
            return;
        }

        this._health = Math.min(this.maxHealth, this._health + amount);
        this.emitHealthChanged();
    }

    // Processa dano garantindo que não ultrapasse os limites configurados.
    public takeDamage(amount: number): void {
        if (amount <= 0 || !this.isAlive()) {
            return;
        }

        this._health = Math.max(0, this._health - amount);
        this.emitHealthChanged();
        this.playDamageEffect();

        if (!this.isAlive()) {
            this.handleDeath();
        }
    }

    private playDamageEffect(): void {
        // Cancela efeitos anteriores para evitar acúmulo de tweens no mesmo sprite.
        this.damageTween?.stop();

        // Aplica flash vermelho curto para dar feedback instantâneo ao jogador.
        this.entity.setTint(0xff6666);
        this.damageTween = this.scene.tweens.add({
            targets: this.entity,
            alpha: { from: 1, to: 0.25 },
            duration: 70,
            repeat: 2,
            yoyo: true,
            onComplete: () => {
                this.entity.clearTint();
                this.entity.setAlpha(1);
            }
        });
    }

    private handleDeath(): void {
        // Limpa efeitos visuais ativos para evitar artefatos após a morte.
        this.damageTween?.stop();
        this.entity.clearTint();
        this.entity.setAlpha(1);

        if (this.entity.body instanceof Physics.Arcade.Body) {
            // Desliga o corpo para não colidir com o cenário enquanto o fade ocorre.
            this.entity.body.enable = false;
            this.entity.setVelocity(0, 0);
        }

        // Executa fade-out suave que reforça visualmente a eliminação do inimigo.
        this.scene.add.tween({
            targets: this.entity,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                this.entity.destroy();
            }
        });
    }

    private emitHealthChanged(): void {
        if (!this.isPlayer()) {
            return;
        }

        // Mantém o HUD atualizado via registry e eventos globais.
        this.scene.game.registry.set('player-health', this._health);
        this.scene.game.events.emit('player-health-changed', this._health);
    }

    private isPlayer(): boolean {
        return this.entity.texture.key === 'player';
    }
}