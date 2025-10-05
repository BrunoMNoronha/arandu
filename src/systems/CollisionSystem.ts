import { Scene, Physics } from 'phaser';
import { HealthComponent } from '../components/HealthComponent';

export class CollisionSystem {
    private scene: Scene;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    /**
     * Configura a detecção de sobreposição entre o jogador e um inimigo.
     * @param player O sprite do jogador.
     * @param enemy O sprite do inimigo.
     */
    public setupCollider(player: Physics.Arcade.Sprite, enemy: Physics.Arcade.Sprite): void {
        this.scene.physics.add.overlap(
            player,
            enemy,
            this.handlePlayerEnemyCollision,
            undefined,
            this
        );
    }

    private handlePlayerEnemyCollision(obj1: any, obj2: any): void {
        if (!(obj1 instanceof Physics.Arcade.Sprite) || !(obj2 instanceof Physics.Arcade.Sprite)) {
            return;
        }
        
        const player = obj1 as Physics.Arcade.Sprite;
        const enemy = obj2 as Physics.Arcade.Sprite;

        const playerHealth = player.getData('health') as HealthComponent;
        const enemyHealth = enemy.getData('health') as HealthComponent;

        // Evita dano múltiplo se um dos corpos já foi desativado
        if (!player.body?.enable || !enemy.body?.enable) {
            return;
        }

        if (playerHealth) {
            playerHealth.takeDamage(10);
        }
        if (enemyHealth) {
            enemyHealth.takeDamage(20); // Dano maior do jogador para o inimigo
        }
    }
}