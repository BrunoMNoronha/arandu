import type { CollisionConfig } from '../../types';

/**
 * Configuração de dano e knockback aplicados em colisões.
 */
export const COLLISION_CONFIG: CollisionConfig = Object.freeze({
    damage: 10,
    knockbackSpeed: 200,
    cooldownMs: 500
}) as CollisionConfig;
