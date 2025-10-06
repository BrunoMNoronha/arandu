import { Scene, Physics } from 'phaser';
import { DamageTextManager } from './DamageTextManager';
import type { DamageTextOptions } from './DamageTextManager';

// Encapsula regras de vida e feedback visual, facilitando reuso em diferentes entidades.
export class HealthComponent {
    private readonly scene: Scene;
    private readonly entity: Physics.Arcade.Sprite;
    private maxHealth: number;
    private _health: number;
    private damageTween: Phaser.Tweens.Tween | null = null;
    private readonly damageTextManager?: DamageTextManager;

    // Recebe todas as dependências via construtor para manter o componente independente.
    constructor(scene: Scene, entity: Physics.Arcade.Sprite, initialHealth: number, damageTextManager?: DamageTextManager) {
        this.scene = scene;
        this.entity = entity;
        this._health = initialHealth;
        this.maxHealth = initialHealth;
        this.damageTextManager = damageTextManager;

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
    public takeDamage(amount: number, options: DamageTextOptions = {}): void {
        if (amount <= 0 || !this.isAlive()) {
            return;
        }

        this._health = Math.max(0, this._health - amount);
        this.emitHealthChanged();
        this.playDamageEffect();
        this.spawnDamageText(amount, options);

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

    private spawnDamageText(amount: number, options: DamageTextOptions = {}): void {
        if (!this.damageTextManager) {
            return;
        }

        const type = this.isPlayer() ? 'player' : 'enemy';
        this.damageTextManager.showDamage(this.entity, amount, type, options);
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

        if (!this.isPlayer()) {
            const xpReward = this.entity.getData('xpReward');
            if (typeof xpReward === 'number') {
                this.scene.game.events.emit('enemy-defeated', { xpReward });
            }
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

    public updateMaxHealth(newMaxHealth: number, refill: boolean = true): void {
        if (newMaxHealth <= 0) {
            return;
        }

        const currentRatio: number = this.maxHealth > 0 ? this._health / this.maxHealth : 1;
        this.maxHealth = newMaxHealth;
        this._health = refill ? newMaxHealth : Math.max(0, Math.round(newMaxHealth * currentRatio));
        this.emitHealthChanged();
    }

    private emitHealthChanged(): void {
        if (!this.isPlayer()) {
            return;
        }

        // Mantém o HUD atualizado via registry e eventos globais.
        const payload = { current: this._health, max: this.maxHealth };
        this.scene.game.registry.set('player-health', payload.current);
        this.scene.game.registry.set('player-max-health', payload.max);
        this.scene.game.events.emit('player-health-changed', payload);
    }

    private isPlayer(): boolean {
        return this.entity.texture.key === 'player';
    }
}