import { Scene, Physics } from 'phaser';
import { EnemyFactory } from '../factories/EnemyFactory';
import { DamageTextManager } from '../components/DamageTextManager';
import { ConfigService } from '../config/ConfigService';
import type { WaveBalanceConfig } from '../config/types';
import { EnemyAISystem } from './EnemyAISystem';

export interface WaveDefinition {
    readonly waveNumber: number;
    readonly enemyCount: number;
    readonly spawnPoints: readonly Phaser.Math.Vector2[];
}

export interface WaveGeneratorStrategy {
    generate(waveNumber: number): WaveDefinition;
}

class ProceduralWaveGenerator implements WaveGeneratorStrategy {
    private readonly scene: Scene;
    private readonly config: WaveBalanceConfig;
    private readonly rng: Phaser.Math.RandomDataGenerator;

    constructor(scene: Scene, config: WaveBalanceConfig) {
        this.scene = scene;
        this.config = config;
        this.rng = new Phaser.Math.RandomDataGenerator();
    }

    public generate(waveNumber: number): WaveDefinition {
        const scaledEnemies: number = Math.round(
            this.config.baseEnemies + (waveNumber - 1) * this.config.enemyGrowthRate
        );
        const variance: number = this.rng.between(-this.config.randomEnemyVariance, this.config.randomEnemyVariance);
        const enemyCount: number = Math.max(1, scaledEnemies + variance);

        const spawnPoints: Phaser.Math.Vector2[] = [];
        const bounds = this.scene.physics.world.bounds;
        const centerX = bounds.centerX;
        const centerY = bounds.centerY;

        for (let i = 0; i < enemyCount; i += 1) {
            const angle: number = this.rng.realInRange(0, Math.PI * 2);
            const radius: number = this.config.spawnRadius + this.rng.realInRange(-this.config.spawnPadding, this.config.spawnPadding);
            const spawnX: number = Phaser.Math.Clamp(
                centerX + Math.cos(angle) * radius,
                bounds.x + this.config.spawnPadding,
                bounds.right - this.config.spawnPadding
            );
            const spawnY: number = Phaser.Math.Clamp(
                centerY + Math.sin(angle) * radius,
                bounds.y + this.config.spawnPadding,
                bounds.bottom - this.config.spawnPadding
            );
            spawnPoints.push(new Phaser.Math.Vector2(spawnX, spawnY));
        }

        return {
            waveNumber,
            enemyCount,
            spawnPoints
        };
    }
}

export class WaveManager {
    private readonly scene: Scene;
    private readonly player: Physics.Arcade.Sprite;
    private readonly enemiesGroup: Physics.Arcade.Group;
    private readonly damageTextManager: DamageTextManager;
    private readonly waveConfig: WaveBalanceConfig;
    private readonly generator: WaveGeneratorStrategy;
    private readonly aiSystems: Map<Physics.Arcade.Sprite, EnemyAISystem> = new Map();
    private currentWave: number = 0;
    private readonly completionEventKey: string = 'all-waves-cleared';
    private readonly waveClearedEventKey: string = 'wave-cleared';
    private readonly waveStartedEventKey: string = 'wave-started';
    private hasEmittedCompletion: boolean = false;
    private isSpawning: boolean = false;

    constructor(scene: Scene, player: Physics.Arcade.Sprite, enemiesGroup: Physics.Arcade.Group, damageTextManager: DamageTextManager) {
        this.scene = scene;
        this.player = player;
        this.enemiesGroup = enemiesGroup;
        this.damageTextManager = damageTextManager;
        this.waveConfig = ConfigService.getInstance().getWaveConfig();
        this.generator = new ProceduralWaveGenerator(scene, this.waveConfig);
    }

    public start(): void {
        this.spawnNextWave();
    }

    public update(): void {
        this.aiSystems.forEach(ai => ai.update());

        if (!this.isSpawning && this.aiSystems.size === 0 && this.currentWave > 0) {
            this.handleWaveCompletion();
        }
    }

    public getCurrentWave(): number {
        return this.currentWave;
    }

    public getTotalWaves(): number {
        return this.waveConfig.totalWaves;
    }

    private spawnNextWave(): void {
        if (this.currentWave >= this.waveConfig.totalWaves) {
            return;
        }

        this.isSpawning = true;
        const nextWaveNumber: number = this.currentWave + 1;
        const waveDefinition = this.generator.generate(nextWaveNumber);
        this.currentWave = nextWaveNumber;

        this.scene.game.events.emit(this.waveStartedEventKey, {
            waveNumber: this.currentWave,
            totalWaves: this.waveConfig.totalWaves,
            enemyCount: waveDefinition.enemyCount
        });

        waveDefinition.spawnPoints.forEach(point => {
            const enemy = this.spawnEnemy(point.x, point.y);
            this.registerEnemy(enemy);
        });

        this.isSpawning = false;
    }

    private spawnEnemy(x: number, y: number): Physics.Arcade.Sprite {
        return EnemyFactory.create(this.scene, x, y, this.damageTextManager);
    }

    private registerEnemy(enemy: Physics.Arcade.Sprite): void {
        this.enemiesGroup.add(enemy);
        const aiSystem = new EnemyAISystem(enemy, this.player);
        this.aiSystems.set(enemy, aiSystem);

        enemy.once(Phaser.GameObjects.Events.DESTROY, () => {
            this.aiSystems.delete(enemy);
            this.scene.time.delayedCall(0, () => {
                if (!this.isSpawning && this.aiSystems.size === 0) {
                    this.handleWaveCompletion();
                }
            });
        });
    }

    private handleWaveCompletion(): void {
        this.scene.game.events.emit(this.waveClearedEventKey, {
            waveNumber: this.currentWave,
            totalWaves: this.waveConfig.totalWaves
        });

        if (this.currentWave >= this.waveConfig.totalWaves) {
            if (!this.hasEmittedCompletion) {
                this.hasEmittedCompletion = true;
                this.scene.game.events.emit(this.completionEventKey, {
                    waveNumber: this.currentWave,
                    totalWaves: this.waveConfig.totalWaves
                });
            }
            return;
        }

        this.scene.time.delayedCall(650, () => {
            if (!this.isSpawning && this.aiSystems.size === 0) {
                this.spawnNextWave();
            }
        });
    }
}
