import { Scene, Physics } from 'phaser';
import { HealthComponent } from '../components/HealthComponent';
import { ConfigService } from '../config/ConfigService';
import type { PlayerAttackConfig } from '../config/types';

export class AttackSystem {
    private scene: Scene;
    private player: Physics.Arcade.Sprite;
    private attackKey: Phaser.Input.Keyboard.Key;
    private isAttacking: boolean = false;
    private readonly attackConfig: PlayerAttackConfig;
    private lastAttackTimestamp: number = 0;

    constructor(scene: Scene, player: Physics.Arcade.Sprite) {
        this.scene = scene;
        this.player = player;
        this.attackKey = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.attackConfig = ConfigService.getInstance().getCharacterConfig().attack;
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
                    enemyHealth.takeDamage(this.attackConfig.damage);
                }
                // Impede múltiplos acertos no mesmo ataque
                this.scene.physics.world.removeCollider(overlapCollider);
            }
        );

        // Remove a hitbox após um curto período
        this.scene.time.delayedCall(this.attackConfig.durationMs, () => {
            hitbox.destroy();
            this.isAttacking = false;
            this.lastAttackTimestamp = this.scene.time.now + this.attackConfig.cooldownMs;
        });
    }

    private createHitbox(): Physics.Arcade.Sprite {
        const direction = this.player.flipX ? -1 : 1;
        const offsetX = this.attackConfig.hitbox.offsetX * direction;
        const offsetY = this.attackConfig.hitbox.offsetY ?? 0;
        const hitboxX = this.player.x + offsetX;
        const hitboxY = this.player.y + offsetY;

        const hitbox = this.scene.add.sprite(hitboxX, hitboxY, '') as Physics.Arcade.Sprite;
        this.scene.physics.world.enable(hitbox);
        const hitboxBody = hitbox.body as Physics.Arcade.Body;
        hitboxBody.setSize(this.attackConfig.hitbox.width, this.attackConfig.hitbox.height);
        hitboxBody.setAllowGravity(false);
        hitbox.setVisible(false); // A hitbox é invisível

        return hitbox;
    }
}