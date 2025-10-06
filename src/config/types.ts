export interface HitboxConfig {
    readonly width: number;
    readonly height: number;
    readonly offsetX: number;
    readonly offsetY?: number;
}

export interface PrimaryAttributes {
    readonly strength: number;
    readonly agility: number;
    readonly vitality: number;
    readonly intelligence: number;
    readonly dexterity: number;
}

export interface AttributeBaseValues {
    readonly baseHp: number;
    readonly baseMp: number;
    readonly baseAttackSpeed: number;
}

export interface AttributeProgressionRange {
    readonly min: number;
    readonly max: number;
}

export interface AttributeProgressionConfig {
    readonly pointsPerLevel: AttributeProgressionRange;
    readonly experience: ExperienceProgressionConfig;
}

export interface PlayerAttributesConfig {
    readonly base: PrimaryAttributes;
    readonly baseValues: AttributeBaseValues;
    readonly progression: AttributeProgressionConfig;
}

export interface ExperienceProgressionConfig {
    readonly baseExperienceToLevel: number;
    readonly growthRate: number;
}

export interface PlayerMovementConfig {
    readonly baseSpeed: number;
    readonly agilityMultiplier: number;
}

export interface PlayerAttackConfig {
    readonly baseDamage: number;
    readonly hitbox: HitboxConfig;
    readonly durationMs: number;
    readonly baseCooldownMs: number;
}

export interface PlayerConfig {
    readonly attributes: PlayerAttributesConfig;
    readonly movement: PlayerMovementConfig;
    readonly attack: PlayerAttackConfig;
}

export interface DerivedAttributes {
    readonly maxHealth: number;
    readonly maxMana: number;
    readonly physicalAttack: number;
    readonly magicalAttack: number;
    readonly flee: number;
    readonly criticalChance: number;
    readonly physicalDefense: number;
    readonly attackSpeed: number;
}

export interface PlayerAttackDerivedStats {
    readonly damage: number;
    readonly cooldownMs: number;
    readonly durationMs: number;
    readonly hitbox: HitboxConfig;
    readonly criticalChance: number;
}

export interface PlayerStats {
    readonly primary: PrimaryAttributes;
    readonly derived: DerivedAttributes;
    readonly attack: PlayerAttackDerivedStats;
    readonly movementSpeed: number;
    readonly progression: AttributeProgressionConfig;
    readonly progressionState: PlayerProgressionState;
}

export interface PlayerProgressionState {
    readonly level: number;
    readonly experience: number;
    readonly experienceToNextLevel: number;
    readonly availableAttributePoints: number;
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
    readonly xpReward: number;
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
