import { Scene, Physics } from 'phaser';

export class PlayerFactory {
    /**
     * Cria uma nova entidade de jogador com física Arcade.
     * @param scene A cena onde o jogador será criado.
     * @param x A posição inicial X do jogador.
     * @param y A posição inicial Y do jogador.
     * @returns O sprite do jogador com física habilitada.
     */
    public static create(scene: Scene, x: number, y: number): Physics.Arcade.Sprite {
        // Cria o sprite do jogador usando o asset 'player' que já carregamos.
        const player = scene.physics.add.sprite(x, y, 'player');

        // Impede que o jogador saia dos limites do mundo do jogo.
        player.setCollideWorldBounds(true);

        return player;
    }
}