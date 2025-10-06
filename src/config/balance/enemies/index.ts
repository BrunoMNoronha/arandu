import type { EnemyConfig } from '../../types';
import { GOBLIN_CONFIG } from './GoblinConfig';

export const DEFAULT_ENEMY_KEY: string = 'goblin';

export const ENEMY_CONFIGS: Readonly<Record<string, EnemyConfig>> = Object.freeze({
    [DEFAULT_ENEMY_KEY]: GOBLIN_CONFIG
});
