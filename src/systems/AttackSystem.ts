import { Scene, Physics } from 'phaser';
import { HealthComponent } from '../components/HealthComponent';

export class AttackSystem {
    private scene: Scene;
    private player: Physics.Arcade.Sprite;
    private attackKey: Phaser.Input.Keyboard.Key;
    private isAttacking = false;

    constructor(scene: Scene, player: Physics.Arcade.Sprite) {
        this.scene = scene;
        this.player = player;
        this.attackKey = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    public update(enemies: Physics.Arcade.Group): void {
        if (Phaser.Input.Keyboard.JustDown(this.attackKey) && !this.isAttacking) {
            this.executeAttack(enemies);
        }
    }

    private executeAttack(enemies: Physics.Arcade.Group): void {
        this.isAttacking = true;

        const hitbox = this.createHitbox();

        // CORREÇÃO: O parâmetro 'box' foi renomeado para '_box' para indicar que não é utilizado.
        const overlapCollider = this.scene.physics.add.overlap(hitbox, enemies, (_box, enemySprite) => {
            const enemy = enemySprite as Physics.Arcade.Sprite;
            const enemyHealth = enemy.getData('health') as HealthComponent;
            if (enemyHealth) {
                enemyHealth.takeDamage(25); // Dano da espada
            }
            // Impede múltiplos acertos no mesmo ataque
            this.scene.physics.world.removeCollider(overlapCollider);
        });

        // Remove a hitbox após um curto período
        this.scene.time.delayedCall(150, () => {
            hitbox.destroy();
            this.isAttacking = false;
        });
    }
    
    private createHitbox(): Physics.Arcade.Sprite {
        const direction = this.player.flipX ? -1 : 1;
        const hitboxX = this.player.x + (20 * direction);
        const hitboxY = this.player.y;
        
        const hitbox = this.scene.add.sprite(hitboxX, hitboxY, '') as Physics.Arcade.Sprite;
        this.scene.physics.world.enable(hitbox);
        hitbox.body!.setSize(25, 25);
        hitbox.setVisible(false); // A hitbox é invisível

        return hitbox;
    }
}