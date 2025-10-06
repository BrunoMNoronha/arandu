import { COLLISION_CONFIG } from './balance/combat/CollisionConfig';
import { CHARACTER_CONFIGS, DEFAULT_CHARACTER_KEY } from './balance/characters';
import { ENEMY_CONFIGS, DEFAULT_ENEMY_KEY } from './balance/enemies';
import { WAVE_CONFIG } from './balance/waves';
import type { GameBalanceConfig } from './types';

/**
 * Tabela consolidada de balanceamento com referências específicas por categoria.
 */
export const GAME_BALANCE: GameBalanceConfig = Object.freeze({
    characters: CHARACTER_CONFIGS,
    enemies: ENEMY_CONFIGS,
    combat: {
        collision: COLLISION_CONFIG
    },
    waves: WAVE_CONFIG,
    defaults: {
        character: DEFAULT_CHARACTER_KEY,
        enemy: DEFAULT_ENEMY_KEY
    }
}) as GameBalanceConfig;
