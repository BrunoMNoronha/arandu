import { GAME_BALANCE } from './GameBalance';
import type { CollisionConfig, EnemyConfig, GameBalanceConfig, PlayerConfig } from './types';

/**
 * Implementa o padrão Singleton para centralizar acesso às configurações de balanceamento.
 * Isso evita duplicação de constantes hardcoded espalhadas pelo código.
 */
export class ConfigService {
    private static instance: ConfigService | null = null;

    private readonly balance: GameBalanceConfig;

    private constructor(balance: GameBalanceConfig) {
        this.balance = balance;
    }

    public static getInstance(): ConfigService {
        if (!ConfigService.instance) {
            ConfigService.instance = new ConfigService(GAME_BALANCE);
        }

        return ConfigService.instance;
    }

    public getPlayerConfig(): PlayerConfig {
        return this.balance.player;
    }

    public getEnemyConfig(type: string = 'default'): EnemyConfig {
        return this.balance.enemies[type] ?? this.balance.enemies.default;
    }

    public getCollisionConfig(): CollisionConfig {
        return this.balance.combat.collision;
    }
}
