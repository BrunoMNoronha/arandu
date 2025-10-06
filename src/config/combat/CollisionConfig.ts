import type { CollisionConfig } from '../types';

/**
 * Parâmetros de colisão que afetam combate corpo a corpo.
 */
export const COLLISION_CONFIG: CollisionConfig = Object.freeze({
    damage: 10, // dano causado ao colidir com o jogador em pontos de vida
    knockbackSpeed: 80, // velocidade de recuo aplicada em pixels por segundo
    cooldownMs: 500 // tempo mínimo entre danos sucessivos por colisão em milissegundos
}) as CollisionConfig;
