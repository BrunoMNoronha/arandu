import { Scene, Physics } from 'phaser';
import { HealthComponent } from '../components/HealthComponent';
import { ConfigService } from '../config/ConfigService';
import { DamageTextManager } from '../components/DamageTextManager';

export class EnemyFactory {
    /**
     * Cria uma nova entidade de inimigo com física Arcade.
     * @param scene A cena onde o inimigo será criado.
     * @param x A posição inicial X do inimigo.
     * @param y A posição inicial Y do inimigo.
     * @returns O sprite do inimigo com física habilitada.
     */
    public static create(scene: Scene, x: number, y: number, damageTextManager: DamageTextManager): Physics.Arcade.Sprite {
        const enemy = scene.physics.add.sprite(x, y, 'enemy');
        enemy.setCollideWorldBounds(true);

        // Anexa o HealthComponent ao Data Manager do sprite.
        const enemyConfig = ConfigService.getInstance().getEnemyConfig();
        enemy.setData('health', new HealthComponent(scene, enemy, enemyConfig.maxHealth, damageTextManager));
        enemy.setData('xpReward', enemyConfig.xpReward);

        return enemy;
    }
}