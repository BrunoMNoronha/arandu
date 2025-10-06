import { Scene } from 'phaser';
import { ConfigService } from '../config/ConfigService';
import type { PlayerStats } from '../config/types';

interface WaveStartedEventPayload {
    readonly waveNumber: number;
    readonly totalWaves: number;
}

interface WaveClearedEventPayload {
    readonly waveNumber: number;
    readonly totalWaves: number;
}

export class UIScene extends Scene {
    private healthText!: Phaser.GameObjects.Text;
    private waveText!: Phaser.GameObjects.Text;
    private totalWaves: number = 0;
    private attributesText!: Phaser.GameObjects.Text;
    private derivedText!: Phaser.GameObjects.Text;

    constructor() {
        super('UIScene');
    }

    public create(): void {
        const currentHealth = (this.game.registry.get('player-health') as number | undefined) ?? 0;
        const waveConfig = ConfigService.getInstance().getWaveConfig();
        this.totalWaves = waveConfig.totalWaves;

        // Exibe o texto inicial de vida no canto superior esquerdo para reforçar informações críticas ao jogador.
        this.healthText = this.add.text(10, 10, `Vida: ${currentHealth}`, {
            fontSize: '16px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });

        this.waveText = this.add.text(10, 32, this.formatWaveText(0, this.totalWaves), {
            fontSize: '16px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });

        this.attributesText = this.add.text(10, 54, 'Atributos: --', {
            fontSize: '14px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        });

        this.derivedText = this.add.text(10, 74, 'Derivados: --', {
            fontSize: '14px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        });

        const existingStats = this.game.registry.get('player-stats') as PlayerStats | undefined;
        if (existingStats) {
            this.onPlayerStatsInicializados(existingStats);
        }

        // Escuta o evento global para atualizar a vida do jogador sem polling constante.
        this.game.events.on('player-health-changed', this.updateHealthText, this);
        this.game.events.on('wave-started', this.onWaveStarted, this);
        this.game.events.on('wave-cleared', this.onWaveCleared, this);
        this.game.events.on('all-waves-cleared', this.onAllWavesCleared, this);
        this.game.events.on('player-stats-inicializados', this.onPlayerStatsInicializados, this);

        // Garante que a cena seja limpa ao ser desligada para evitar listeners duplicados e vazamentos.
        this.events.on('shutdown', this.handleShutdown, this);
    }

    private updateHealthText(health: number): void {
        this.healthText.setText(`Vida: ${health}`);
    }

    private onWaveStarted(payload: WaveStartedEventPayload): void {
        this.waveText.setText(this.formatWaveText(payload.waveNumber, payload.totalWaves));
    }

    private onWaveCleared(payload: WaveClearedEventPayload): void {
        this.waveText.setText(this.formatWaveText(payload.waveNumber, payload.totalWaves));
    }

    private onAllWavesCleared(): void {
        this.waveText.setText('Todas as ondas completas!');
    }

    private handleShutdown(): void {
        this.game.events.off('player-health-changed', this.updateHealthText, this);
        this.game.events.off('wave-started', this.onWaveStarted, this);
        this.game.events.off('wave-cleared', this.onWaveCleared, this);
        this.game.events.off('all-waves-cleared', this.onAllWavesCleared, this);
        this.game.events.off('player-stats-inicializados', this.onPlayerStatsInicializados, this);
    }

    private formatWaveText(currentWave: number, totalWaves: number): string {
        return `Onda: ${currentWave}/${totalWaves}`;
    }

    private onPlayerStatsInicializados(stats: PlayerStats): void {
        this.attributesText.setText(this.formatAttributesText(stats));
        this.derivedText.setText(this.formatDerivedText(stats));
    }

    private formatAttributesText(stats: PlayerStats): string {
        const primary = stats.primary;
        return `Atributos: FOR ${primary.strength} | AGI ${primary.agility} | VIT ${primary.vitality} | INT ${primary.intelligence} | DES ${primary.dexterity}`;
    }

    private formatDerivedText(stats: PlayerStats): string {
        const derived = stats.derived;
        const attack = stats.attack;
        return `Derivados: HP ${derived.maxHealth} | MP ${derived.maxMana} | ATQ ${this.formatNumber(derived.physicalAttack)} | DEF ${this.formatNumber(derived.physicalDefense)} | CRIT ${this.formatNumber(derived.criticalChance)}% | ASPD ${this.formatNumber(derived.attackSpeed)}/s | DANO ${attack.damage}`;
    }

    private formatNumber(value: number): string {
        return Number.isInteger(value) ? value.toString() : value.toFixed(1);
    }
}