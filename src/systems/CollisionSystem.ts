import { Scene, Physics } from 'phaser';

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

    /**
     * Callback executado quando dois objetos de física se sobrepõem.
     * CORREÇÃO: Os parâmetros são definidos como 'any' para aceitar a união de tipos do Phaser.
     * A segurança é garantida por Type Guards (instanceof) dentro da função.
     * @param obj1 O primeiro objeto na colisão (esperado ser o jogador).
     * @param obj2 O segundo objeto na colisão (esperado ser o inimigo).
     */
    private handlePlayerEnemyCollision(obj1: any, obj2: any): void {
        // Type Guard: Garante que estamos lidando com Sprites antes de continuar.
        if (!(obj1 instanceof Physics.Arcade.Sprite) || !(obj2 instanceof Physics.Arcade.Sprite)) {
            return;
        }
        
        const enemy = obj2 as Physics.Arcade.Sprite;

        console.log('Colisão detectada entre Jogador e Inimigo!');
        
        if (enemy.body instanceof Physics.Arcade.Body) {
            enemy.body.enable = false;
        }
        
        this.scene.add.tween({
            targets: enemy,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                enemy.destroy();
            }
        });
    }
}