export interface HitboxConfig {
    readonly width: number;
    readonly height: number;
    readonly offsetX: number;
    readonly offsetY?: number;
}

export interface PlayerAttackConfig {
    readonly damage: number;
    readonly hitbox: HitboxConfig;
    readonly durationMs: number;
    readonly cooldownMs: number;
}

export interface PlayerConfig {
    readonly maxHealth: number;
    readonly movementSpeed: number;
    readonly attack: PlayerAttackConfig;
}

export interface EnemyAISettings {
    readonly patrolRange: number;
    readonly detectionRadius: number;
    readonly patrolSpeed: number;
    readonly chaseSpeed: number;
}

export interface EnemyConfig {
    readonly maxHealth: number;
    readonly ai: EnemyAISettings;
}

export interface CollisionConfig {
    readonly damage: number;
    readonly knockbackSpeed: number;
    readonly cooldownMs: number;
}

export type CharacterConfigMap = Readonly<Record<string, PlayerConfig>>;

export type EnemyConfigMap = Readonly<Record<string, EnemyConfig>>;

export interface WaveBalanceConfig {
    readonly totalWaves: number;
    readonly baseEnemies: number;
    readonly enemyGrowthRate: number;
    readonly randomEnemyVariance: number;
    readonly spawnRadius: number;
    readonly spawnPadding: number;
}

export interface GameBalanceDefaults {
    readonly character: string;
    readonly enemy: string;
}

export interface GameBalanceConfig {
    readonly characters: CharacterConfigMap;
    readonly enemies: EnemyConfigMap;
    readonly combat: {
        readonly collision: CollisionConfig;
    };
    readonly waves: WaveBalanceConfig;
    readonly defaults: GameBalanceDefaults;
}
