import { COLLISION_CONFIG } from './combat/CollisionConfig';
import { DEFAULT_ENEMY_CONFIG } from './enemies/DefaultEnemyConfig';
import { PLAYER_CONFIG } from './player/PlayerConfig';
import type { GameBalanceConfig } from './types';

/**
 * Tabela consolidada de balanceamento com referências específicas por categoria.
 */
export const GAME_BALANCE: GameBalanceConfig = Object.freeze({
    player: PLAYER_CONFIG,
    enemies: {
        default: DEFAULT_ENEMY_CONFIG
    },
    combat: {
        collision: COLLISION_CONFIG
    }
}) as GameBalanceConfig;
