import { Physics } from 'phaser';

const ENEMY_SPEED = 50;

export class EnemyAISystem {
    private enemy: Physics.Arcade.Sprite;

    constructor(enemy: Physics.Arcade.Sprite) {
        this.enemy = enemy;
        // Inicia o movimento do inimigo para a direita.
        this.enemy.setVelocityX(ENEMY_SPEED);
    }

    public update(): void {
        // Inverte a direção horizontal se o inimigo colidir com uma parede.
        if (this.enemy.body?.blocked.right) {
            this.enemy.setVelocityX(-ENEMY_SPEED);
        } else if (this.enemy.body?.blocked.left) {
            this.enemy.setVelocityX(ENEMY_SPEED);
        }
    }
}