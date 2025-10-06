import Phaser, { Physics } from 'phaser';
import { HealthComponent } from '../components/HealthComponent';

type EnemyState = 'patrolling' | 'chasing' | 'returning';

export interface EnemyAIConfig {
    readonly patrolRange?: number;
    readonly detectionRadius?: number;
    readonly patrolSpeed?: number;
    readonly chaseSpeed?: number;
}

export class EnemyAISystem {
    private readonly enemy: Physics.Arcade.Sprite;
    private readonly player: Physics.Arcade.Sprite;
    private readonly patrolRange: number;
    private readonly detectionRadius: number;
    private readonly patrolSpeed: number;
    private readonly chaseSpeed: number;
    private readonly originX: number;
    private state: EnemyState = 'patrolling';
    private direction: number = 1;

    // Mantém todas as dependências explicitadas para facilitar testes e reuso da IA.
    constructor(enemy: Physics.Arcade.Sprite, player: Physics.Arcade.Sprite, config: EnemyAIConfig = {}) {
        this.enemy = enemy;
        this.player = player;
        this.patrolRange = config.patrolRange ?? 64;
        this.detectionRadius = config.detectionRadius ?? 120;
        this.patrolSpeed = config.patrolSpeed ?? 45;
        this.chaseSpeed = config.chaseSpeed ?? 75;
        this.originX = enemy.x;

        // Define a velocidade inicial para que o inimigo já comece a patrulhar, evitando frames ociosos.
        this.enemy.setVelocityX(this.patrolSpeed);
    }

    public update(): void {
        if (!this.enemy.active) {
            return;
        }

        // Calcula a distância euclidiana entre inimigo e jogador para guiar a mudança de estado, garantindo reações naturais.
        const distanceToPlayer = Phaser.Math.Distance.Between(
            this.enemy.x,
            this.enemy.y,
            this.player.x,
            this.player.y
        );
        // Alternativa mais performática: comparar distâncias ao quadrado para evitar raiz quadrada quando houver muitos inimigos.

        if (this.shouldChase(distanceToPlayer)) {
            this.state = 'chasing';
        } else if (this.state === 'chasing' && distanceToPlayer > this.detectionRadius * 1.2) {
            this.state = 'returning';
        }

        switch (this.state) {
            case 'patrolling':
                this.handlePatrol();
                break;
            case 'chasing':
                this.handleChase();
                break;
            case 'returning':
                this.handleReturn();
                break;
            default:
                this.handlePatrol();
        }
    }

    private shouldChase(distanceToPlayer: number): boolean {
        // Consulta a vida do jogador para evitar perseguir alvos já derrotados, poupando processamento.
        const playerHealth = this.player.getData('health') as HealthComponent | undefined;
        return distanceToPlayer <= this.detectionRadius && (playerHealth?.isAlive() ?? false);
    }

    private handlePatrol(): void {
        const leftBoundary = this.originX - this.patrolRange;
        const rightBoundary = this.originX + this.patrolRange;

        // Inverte a direção ao atingir limites ou paredes, mantendo o patrulhamento dentro da área designada.
        if (this.enemy.body?.blocked.right || this.enemy.x >= rightBoundary) {
            this.direction = -1;
        } else if (this.enemy.body?.blocked.left || this.enemy.x <= leftBoundary) {
            this.direction = 1;
        }

        // Mantém o inimigo em movimento horizontal suave, evitando jitter vertical.
        this.enemy.setVelocityX(this.patrolSpeed * this.direction);
        this.enemy.setVelocityY(0);
        this.updateFlipFromVelocity();
    }

    private handleChase(): void {
        // Calcula o ângulo até o jogador para direcionar a perseguição com suavidade.
        const angle = Phaser.Math.Angle.Between(
            this.enemy.x,
            this.enemy.y,
            this.player.x,
            this.player.y
        );

        // Transforma o ângulo em vetores de velocidade para um movimento contínuo em direção ao alvo.
        const velocityX = Math.cos(angle) * this.chaseSpeed;
        const velocityY = Math.sin(angle) * this.chaseSpeed;

        this.enemy.setVelocity(velocityX, velocityY);
        this.enemy.flipX = velocityX < 0;
        this.direction = velocityX >= 0 ? 1 : -1;
    }

    private handleReturn(): void {
        const deltaX = this.originX - this.enemy.x;

        if (Math.abs(deltaX) <= 2) {
            // Ao chegar na origem, retomamos patrulha rapidamente para reduzir tempo ocioso.
            this.state = 'patrolling';
            this.direction = deltaX >= 0 ? 1 : -1;
            this.enemy.setVelocityX(this.patrolSpeed * this.direction);
            this.enemy.setVelocityY(0);
            return;
        }

        // Move o inimigo de volta ao ponto inicial mantendo coerência espacial.
        this.direction = Math.sign(deltaX) || 1;
        this.enemy.setVelocityX(this.patrolSpeed * this.direction);
        this.enemy.setVelocityY(0);
        this.enemy.flipX = this.direction < 0;
    }

    private updateFlipFromVelocity(): void {
        // Ajusta o sprite para olhar na direção correta, melhorando a leitura visual do movimento.
        const currentVelocityX = this.enemy.body?.velocity.x ?? 0;
        this.enemy.flipX = currentVelocityX < 0;
    }
}