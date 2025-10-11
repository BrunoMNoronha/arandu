import { Scene, Physics } from 'phaser';
import { HealthComponent } from '../components/HealthComponent';
import type { PlayerAttackDerivedStats, PlayerStats } from '../config/types';
import { getRequiredPlayerStats } from './utils/getRequiredPlayerStats';
import type { PlayerProgressionUpdatePayload } from './PlayerProgressionSystem';

export class AttackSystem {
    private scene: Scene;
    private player: Physics.Arcade.Sprite;
    private attackKey: Phaser.Input.Keyboard.Key;
    private isAttacking: boolean = false;
    private attackStats: PlayerAttackDerivedStats;
    private readonly randomGenerator: Phaser.Math.RandomDataGenerator;
    private nextAllowedAttackAt: number = 0;
    private readonly sceneEvents: Phaser.Events.EventEmitter;
    private readonly handleProgressionUpdate: (payload: PlayerProgressionUpdatePayload) => void;

    constructor(scene: Scene, player: Physics.Arcade.Sprite) {
        this.scene = scene;
        this.player = player;
        this.attackKey = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        const playerStats: PlayerStats = getRequiredPlayerStats(player);
        this.attackStats = { ...playerStats.attack };
        this.randomGenerator = new Phaser.Math.RandomDataGenerator();
        this.sceneEvents = this.scene.game.events;
        this.handleProgressionUpdate = (payload: PlayerProgressionUpdatePayload): void => {
            this.onPlayerProgressionUpdated(payload);
        };
        this.sceneEvents.on('player-progression-updated', this.handleProgressionUpdate);
    }

    public update(enemies: Physics.Arcade.Group): void {
        const now = this.scene.time.now;
        if (Phaser.Input.Keyboard.JustDown(this.attackKey) && !this.isAttacking && now >= this.nextAllowedAttackAt) {
            this.executeAttack(enemies);
        }
    }

    private executeAttack(enemies: Physics.Arcade.Group): void {
        this.isAttacking = true;

        const hitbox = this.createHitbox();
        const hitEnemies: Set<Physics.Arcade.Sprite> = new Set();

        const overlapCollider: Physics.Arcade.Collider = this.scene.physics.add.overlap(
            hitbox,
            enemies,
            (_box, enemySprite) => {
                const enemy = enemySprite as Physics.Arcade.Sprite;
                if (hitEnemies.has(enemy)) {
                    return;
                }
                hitEnemies.add(enemy);
                const enemyHealth = enemy.getData('health') as HealthComponent;
                if (enemyHealth) {
                    const { damage, isCritical } = this.rollDamage();
                    enemyHealth.takeDamage(damage, { critical: isCritical });
                }
            }
        );

        // Remove a hitbox após um curto período
        this.scene.time.delayedCall(this.attackStats.durationMs, () => {
            hitbox.destroy();
            this.isAttacking = false;
            this.nextAllowedAttackAt = this.scene.time.now + this.attackStats.cooldownMs;
            this.scene.physics.world.removeCollider(overlapCollider);
        });
    }

    private createHitbox(): Phaser.GameObjects.Zone {
        const direction = this.player.flipX ? -1 : 1;
        const offsetX = this.attackStats.hitbox.offsetX * direction;
        const offsetY = this.attackStats.hitbox.offsetY ?? 0;
        const hitboxX = this.player.x + offsetX;
        const hitboxY = this.player.y + offsetY;

        const hitbox = this.scene.add.zone(
            hitboxX,
            hitboxY,
            this.attackStats.hitbox.width,
            this.attackStats.hitbox.height
        );
        this.scene.physics.add.existing(hitbox);
        const hitboxBody = hitbox.body as Physics.Arcade.Body;
        hitboxBody.setAllowGravity(false);
        hitboxBody.setImmovable(true);

        return hitbox;
    }

    private rollDamage(): { damage: number; isCritical: boolean } {
        const roll = this.randomGenerator.realInRange(0, 100);
        const isCritical = roll < this.attackStats.criticalChance;
        const damage = isCritical ? Math.round(this.attackStats.damage * 1.5) : this.attackStats.damage;

        return { damage, isCritical };
    }

    private onPlayerProgressionUpdated(_payload: PlayerProgressionUpdatePayload): void {
        const updatedStats: PlayerStats = getRequiredPlayerStats(this.player);
        this.attackStats = { ...updatedStats.attack };
    }

    public destroy(): void {
        this.sceneEvents.off('player-progression-updated', this.handleProgressionUpdate);
    }
}
