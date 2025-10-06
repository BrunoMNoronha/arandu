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

    public getCharacterConfig(type?: string): PlayerConfig {
        const requestedType: string = type ?? this.balance.defaults.character;
        return this.balance.characters[requestedType] ?? this.balance.characters[this.balance.defaults.character];
    }

    public getPlayerConfig(type?: string): PlayerConfig {
        return this.getCharacterConfig(type);
    }

    public listAvailableCharacters(): readonly string[] {
        return Object.freeze([...Object.keys(this.balance.characters)]);
    }

    public getEnemyConfig(type?: string): EnemyConfig {
        const requestedType: string = type ?? this.balance.defaults.enemy;
        return this.balance.enemies[requestedType] ?? this.balance.enemies[this.balance.defaults.enemy];
    }

    public listAvailableEnemies(): readonly string[] {
        return Object.freeze([...Object.keys(this.balance.enemies)]);
    }

    public getCollisionConfig(): CollisionConfig {
        return this.balance.combat.collision;
    }
}
