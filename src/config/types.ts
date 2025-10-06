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

export interface GameBalanceConfig {
    readonly player: PlayerConfig;
    readonly enemies: Record<string, EnemyConfig>;
    readonly combat: {
        readonly collision: CollisionConfig;
    };
}
