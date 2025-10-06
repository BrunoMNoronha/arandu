import { Scene, Physics } from 'phaser';
import { HealthComponent } from '../components/HealthComponent';
import type { PlayerAttackDerivedStats, PlayerStats } from '../config/types';

export class AttackSystem {
    private scene: Scene;
    private player: Physics.Arcade.Sprite;
    private attackKey: Phaser.Input.Keyboard.Key;
    private isAttacking: boolean = false;
    private readonly attackStats: PlayerAttackDerivedStats;
    private readonly randomGenerator: Phaser.Math.RandomDataGenerator;
    private lastAttackTimestamp: number = 0;

    constructor(scene: Scene, player: Physics.Arcade.Sprite) {
        this.scene = scene;
        this.player = player;
        this.attackKey = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        const playerStats: PlayerStats = this.extractStats(player);
        this.attackStats = playerStats.attack;
        this.randomGenerator = new Phaser.Math.RandomDataGenerator();
    }

    public update(enemies: Physics.Arcade.Group): void {
        const now = this.scene.time.now;
        if (Phaser.Input.Keyboard.JustDown(this.attackKey) && !this.isAttacking && now >= this.lastAttackTimestamp) {
            this.executeAttack(enemies);
        }
    }

    private executeAttack(enemies: Physics.Arcade.Group): void {
        this.isAttacking = true;

        const hitbox = this.createHitbox();

        // CORREÇÃO: O parâmetro 'box' foi renomeado para '_box' para indicar que não é utilizado.
        const overlapCollider: Physics.Arcade.Collider = this.scene.physics.add.overlap(
            hitbox,
            enemies,
            (_box, enemySprite) => {
                const enemy = enemySprite as Physics.Arcade.Sprite;
                const enemyHealth = enemy.getData('health') as HealthComponent;
                if (enemyHealth) {
                    const { damage, isCritical } = this.rollDamage();
                    enemyHealth.takeDamage(damage, { critical: isCritical });
                }
                // Impede múltiplos acertos no mesmo ataque
                this.scene.physics.world.removeCollider(overlapCollider);
            }
        );

        // Remove a hitbox após um curto período
        this.scene.time.delayedCall(this.attackStats.durationMs, () => {
            hitbox.destroy();
            this.isAttacking = false;
            this.lastAttackTimestamp = this.scene.time.now + this.attackStats.cooldownMs;
        });
    }

    private createHitbox(): Physics.Arcade.Sprite {
        const direction = this.player.flipX ? -1 : 1;
        const offsetX = this.attackStats.hitbox.offsetX * direction;
        const offsetY = this.attackStats.hitbox.offsetY ?? 0;
        const hitboxX = this.player.x + offsetX;
        const hitboxY = this.player.y + offsetY;

        const hitbox = this.scene.add.sprite(hitboxX, hitboxY, '') as Physics.Arcade.Sprite;
        this.scene.physics.world.enable(hitbox);
        const hitboxBody = hitbox.body as Physics.Arcade.Body;
        hitboxBody.setSize(this.attackStats.hitbox.width, this.attackStats.hitbox.height);
        hitboxBody.setAllowGravity(false);
        hitbox.setVisible(false); // A hitbox é invisível

        return hitbox;
    }

    private extractStats(player: Physics.Arcade.Sprite): PlayerStats {
        const stats = player.getData('stats') as PlayerStats | undefined;
        if (!stats) {
            throw new Error('PlayerStats não inicializados no sprite do jogador.');
        }

        return stats;
    }

    private rollDamage(): { damage: number; isCritical: boolean } {
        const roll = this.randomGenerator.realInRange(0, 100);
        const isCritical = roll < this.attackStats.criticalChance;
        const damage = isCritical ? Math.round(this.attackStats.damage * 1.5) : this.attackStats.damage;

        return { damage, isCritical };
    }
}