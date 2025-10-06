import type { EnemyConfig } from '../../types';

/**
 * Configuração base para o inimigo Goblin.
 */
export const GOBLIN_CONFIG: EnemyConfig = Object.freeze({
    maxHealth: 30,
    ai: {
        patrolRange: 64,
        detectionRadius: 120,
        patrolSpeed: 45,
        chaseSpeed: 75
    }
}) as EnemyConfig;
