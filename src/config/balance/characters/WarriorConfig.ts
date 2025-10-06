import type { PlayerConfig } from '../../types';

/**
 * Configuração de atributos base do Guerreiro padrão.
 */
export const WARRIOR_CONFIG: PlayerConfig = Object.freeze({
    maxHealth: 100,
    movementSpeed: 100,
    attack: {
        damage: 25,
        hitbox: {
            width: 25,
            height: 25,
            offsetX: 20,
            offsetY: 0
        },
        durationMs: 150,
        cooldownMs: 200
    }
}) as PlayerConfig;
