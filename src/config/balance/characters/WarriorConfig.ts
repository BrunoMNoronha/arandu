import type { PlayerConfig } from '../../types';

/**
 * Configuração de atributos base do Guerreiro padrão.
 */
export const WARRIOR_CONFIG: PlayerConfig = Object.freeze({
    attributes: {
        base: {
            strength: 9,
            agility: 8,
            vitality: 4,
            intelligence: 4,
            dexterity: 6,
        },
        baseValues: {
            baseHp: 20,
            baseMp: 30,
            baseAttackSpeed: 1.5,
        },
        progression: {
            pointsPerLevel: {
                min: 3,
                max: 5,
            },
        },
    },
    movement: {
        baseSpeed: 80,
        agilityMultiplier: 2.5,
    },
    attack: {
        baseDamage: 5,
        hitbox: {
            width: 25,
            height: 25,
            offsetX: 20,
            offsetY: 0,
        },
        durationMs: 150,
        baseCooldownMs: 600,
    },
}) as PlayerConfig;
