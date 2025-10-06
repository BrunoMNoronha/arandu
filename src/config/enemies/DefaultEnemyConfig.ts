import type { EnemyConfig } from '../types';

/**
 * Configuração padrão para inimigos básicos.
 */
export const DEFAULT_ENEMY_CONFIG: EnemyConfig = Object.freeze({
    maxHealth: 30, // pontos de vida máximos do inimigo padrão
    ai: {
        patrolRange: 64, // raio máximo de patrulha em pixels
        detectionRadius: 120, // distância para iniciar perseguição em pixels
        patrolSpeed: 45, // velocidade durante patrulha em pixels por segundo
        chaseSpeed: 75 // velocidade durante perseguição em pixels por segundo
    }
}) as EnemyConfig;
