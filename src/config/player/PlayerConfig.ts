import type { PlayerConfig } from '../types';

/**
 * Configuração de atributos base do jogador.
 */
export const PLAYER_CONFIG: PlayerConfig = Object.freeze({
    maxHealth: 100, // pontos de vida máximos iniciais
    movementSpeed: 100, // velocidade de deslocamento em pixels por segundo
    attack: {
        damage: 25, // dano aplicado por ataque corpo a corpo
        hitbox: {
            width: 25, // largura da hitbox do ataque em pixels
            height: 25, // altura da hitbox do ataque em pixels
            offsetX: 20, // deslocamento horizontal da hitbox em relação ao centro do jogador
            offsetY: 0 // deslocamento vertical da hitbox em relação ao centro do jogador
        },
        durationMs: 150, // duração da animação de ataque em milissegundos
        cooldownMs: 200 // intervalo mínimo entre ataques consecutivos em milissegundos
    }
}) as PlayerConfig;
