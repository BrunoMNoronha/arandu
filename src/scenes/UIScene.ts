import { Scene } from 'phaser';
import { ConfigService } from '../config/ConfigService';

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

        // Escuta o evento global para atualizar a vida do jogador sem polling constante.
        this.game.events.on('player-health-changed', this.updateHealthText, this);
        this.game.events.on('wave-started', this.onWaveStarted, this);
        this.game.events.on('wave-cleared', this.onWaveCleared, this);
        this.game.events.on('all-waves-cleared', this.onAllWavesCleared, this);

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
    }

    private formatWaveText(currentWave: number, totalWaves: number): string {
        return `Onda: ${currentWave}/${totalWaves}`;
    }
}