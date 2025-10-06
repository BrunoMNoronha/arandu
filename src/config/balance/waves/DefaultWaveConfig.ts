import type { WaveBalanceConfig } from '../../types';

/**
 * Define parâmetros centrais do modo horda com escalonamento gradual.
 */
export const DEFAULT_WAVE_CONFIG: WaveBalanceConfig = Object.freeze({
    totalWaves: 10,
    baseEnemies: 3,
    enemyGrowthRate: 1.6,
    randomEnemyVariance: 2,
    spawnRadius: 180,
    spawnPadding: 48
}) as WaveBalanceConfig;
