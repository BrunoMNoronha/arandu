import { Scene, Physics } from 'phaser';
import { HealthComponent } from '../components/HealthComponent';

export class EnemyFactory {
    /**
     * Cria uma nova entidade de inimigo com física Arcade.
     * @param scene A cena onde o inimigo será criado.
     * @param x A posição inicial X do inimigo.
     * @param y A posição inicial Y do inimigo.
     * @returns O sprite do inimigo com física habilitada.
     */
    public static create(scene: Scene, x: number, y: number): Physics.Arcade.Sprite {
        const enemy = scene.physics.add.sprite(x, y, 'enemy');
        enemy.setCollideWorldBounds(true);

        // Anexa o HealthComponent ao Data Manager do sprite.
        enemy.setData('health', new HealthComponent(scene, enemy, 30));

        return enemy;
    }
}