import { Scene, Physics } from 'phaser';

export class EnemyFactory {
    /**
     * Cria uma nova entidade de inimigo com física Arcade.
     * @param scene A cena onde o inimigo será criado.
     * @param x A posição inicial X do inimigo.
     * @param y A posição inicial Y do inimigo.
     * @returns O sprite do inimigo com física habilitada.
     */
    public static create(scene: Scene, x: number, y: number): Physics.Arcade.Sprite {
        // Cria o sprite do inimigo usando o asset 'enemy'.
        const enemy = scene.physics.add.sprite(x, y, 'enemy');

        // Impede que o inimigo saia dos limites do mundo do jogo.
        enemy.setCollideWorldBounds(true);

        return enemy;
    }
}