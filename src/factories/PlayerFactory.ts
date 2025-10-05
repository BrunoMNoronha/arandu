import { Scene, Physics } from 'phaser';
import { HealthComponent } from '../components/HealthComponent';

export class PlayerFactory {
    /**
     * Cria uma nova entidade de jogador com física Arcade.
     * @param scene A cena onde o jogador será criado.
     * @param x A posição inicial X do jogador.
     * @param y A posição inicial Y do jogador.
     * @returns O sprite do jogador com física habilitada.
     */
    public static create(scene: Scene, x: number, y: number): Physics.Arcade.Sprite {
        const player = scene.physics.add.sprite(x, y, 'player');
        player.setCollideWorldBounds(true);

        // Anexa o HealthComponent ao Data Manager do sprite.
        player.setData('health', new HealthComponent(scene, player, 100));

        return player;
    }
}