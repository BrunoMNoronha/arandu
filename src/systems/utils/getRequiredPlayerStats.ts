import type { Physics } from 'phaser';
import type { PlayerStats } from '../../config/types';

export const getRequiredPlayerStats = (player: Physics.Arcade.Sprite): PlayerStats => {
    const stats = player.getData('stats') as PlayerStats | undefined;
    if (!stats) {
        throw new Error('PlayerStats não inicializados no sprite do jogador.');
    }

    return stats;
};
