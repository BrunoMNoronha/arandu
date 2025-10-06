import type {
    AttributeBaseValues,
    DerivedAttributes,
    PlayerAttackDerivedStats,
    PlayerConfig,
    PlayerProgressionState,
    PlayerStats,
    PrimaryAttributes,
} from '../../config/types';

const MIN_ATTACK_COOLDOWN_MS: number = 80;

/**
 * Singleton responsável por transformar atributos primários em estatísticas derivadas.
 * Centraliza as fórmulas para manter consistência entre diferentes sistemas do jogo.
 */
export class AttributeCalculator {
    private static instance: AttributeCalculator | null = null;

    private constructor() {}

    public static getInstance(): AttributeCalculator {
        if (!AttributeCalculator.instance) {
            AttributeCalculator.instance = new AttributeCalculator();
        }

        return AttributeCalculator.instance;
    }

    public computePlayerStats(
        config: PlayerConfig,
        primaryOverrides?: PrimaryAttributes,
        progressionStateOverrides?: PlayerProgressionState
    ): PlayerStats {
        const primary: PrimaryAttributes = primaryOverrides
            ? { ...primaryOverrides }
            : { ...config.attributes.base };
        const derived: DerivedAttributes = this.computeDerivedAttributes(primary, config.attributes.baseValues);
        const attack: PlayerAttackDerivedStats = this.computeAttackStats(config, derived);
        const frozenAttack: PlayerAttackDerivedStats = Object.freeze({
            ...attack,
            hitbox: Object.freeze({ ...attack.hitbox }),
        });
        const movementSpeed: number = this.computeMovementSpeed(config, primary);
        const progressionState: PlayerProgressionState = progressionStateOverrides
            ? { ...progressionStateOverrides }
            : {
                  level: 1,
                  experience: 0,
                  experienceToNextLevel: config.attributes.progression.experience.baseExperienceToLevel,
                  availableAttributePoints: 0,
              };

        return Object.freeze({
            primary: Object.freeze(primary),
            derived: Object.freeze(derived),
            attack: frozenAttack,
            movementSpeed,
            progression: Object.freeze({
                pointsPerLevel: Object.freeze({ ...config.attributes.progression.pointsPerLevel }),
                experience: Object.freeze({ ...config.attributes.progression.experience }),
            }),
            progressionState: Object.freeze(progressionState),
        });
    }

    private computeDerivedAttributes(primary: PrimaryAttributes, baseValues: AttributeBaseValues): DerivedAttributes {
        const maxHealth = Math.round(baseValues.baseHp + primary.vitality * 20);
        const maxMana = Math.round(baseValues.baseMp + primary.intelligence * 15);
        const physicalAttack = Number((primary.strength * 2 + primary.dexterity * 0.5).toFixed(2));
        const magicalAttack = Number((primary.intelligence * 2).toFixed(2));
        const flee = Number((primary.agility * 1.5).toFixed(2));
        const criticalChance = Number((primary.dexterity * 0.3).toFixed(2));
        const physicalDefense = Number((primary.vitality * 0.8).toFixed(2));
        const attackSpeed = Number((baseValues.baseAttackSpeed + primary.agility * 0.4).toFixed(2));

        return {
            maxHealth,
            maxMana,
            physicalAttack,
            magicalAttack,
            flee,
            criticalChance,
            physicalDefense,
            attackSpeed,
        };
    }

    private computeAttackStats(config: PlayerConfig, derived: DerivedAttributes): PlayerAttackDerivedStats {
        const attackSpeed = Math.max(derived.attackSpeed, 0.1);
        const cooldownFromSpeed = 1000 / attackSpeed;
        const normalizedCooldown = Math.min(config.attack.baseCooldownMs, cooldownFromSpeed);
        const cooldownMs = Math.max(Math.round(normalizedCooldown), MIN_ATTACK_COOLDOWN_MS);
        const damage = Math.round(config.attack.baseDamage + derived.physicalAttack);

        return {
            damage,
            cooldownMs,
            durationMs: config.attack.durationMs,
            hitbox: { ...config.attack.hitbox },
            criticalChance: derived.criticalChance,
        };
    }

    private computeMovementSpeed(config: PlayerConfig, primary: PrimaryAttributes): number {
        return Math.round(config.movement.baseSpeed + primary.agility * config.movement.agilityMultiplier);
    }
}
