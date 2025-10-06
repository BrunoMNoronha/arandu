import Phaser, { Scene, Physics } from 'phaser';
import { HealthComponent } from '../components/HealthComponent';

// Gerencia colisões e dano por contato mantendo a lógica isolada da cena.
export class CollisionSystem {
    private readonly scene: Scene;
    private readonly collisionDamage: number = 10;
    private readonly damageCooldown: number = 500;
    private nextDamageTimestamp: number = 0;
    private readonly handlePlayerEnemyOverlap: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback;

    constructor(scene: Scene) {
        this.scene = scene;

        // Função em cache evita re-alocações por frame ao lidar com overlaps frequentes.
        this.handlePlayerEnemyOverlap = (
            playerGameObject,
            enemyGameObject
        ) => {
            if (!(playerGameObject instanceof Physics.Arcade.Sprite) || !(enemyGameObject instanceof Physics.Arcade.Sprite)) {
                return;
            }

            // Respeita o cooldown para impedir dano em todos os frames, deixando o contato mais justo.
            const now = this.scene.time.now;
            if (now < this.nextDamageTimestamp) {
                return;
            }

            // Usa o componente de vida compartilhado para manter regra de mortalidade centralizada.
            const playerHealth = playerGameObject.getData('health') as HealthComponent | undefined;
            if (!playerHealth || !playerHealth.isAlive()) {
                return;
            }

            this.nextDamageTimestamp = now + this.damageCooldown;
            playerHealth.takeDamage(this.collisionDamage);

            // Aplica recuo para comunicar o dano visualmente e criar espaço para reação.
            const knockbackDirection = Math.sign(playerGameObject.x - enemyGameObject.x) || 1;
            playerGameObject.setVelocityX(knockbackDirection * 80);
        };
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

        // Usa overlap separado para desacoplar dano da física rígida, permitindo controle fino.
        this.scene.physics.add.overlap(
            player,
            enemies,
            this.handlePlayerEnemyOverlap,
            undefined,
            this
        );
    }

}