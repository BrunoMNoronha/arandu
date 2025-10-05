import { Scene, Physics } from 'phaser';

export class CollisionSystem {
    private scene: Scene;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    /**
     * Configura a colisão física entre jogador e um grupo de inimigos para que não se sobreponham.
     * @param player O sprite do jogador.
     * @param enemies O grupo de sprites de inimigos.
     */
    public setupCollider(player: Physics.Arcade.Sprite, enemies: Physics.Arcade.Group): void {
        // Esta colisão agora apenas impede que os corpos se atravessem.
        // A lógica de dano foi movida para o AttackSystem.
        this.scene.physics.add.collider(player, enemies);
    }
}