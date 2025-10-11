import Phaser, { Scene } from 'phaser';
import { ConfigService } from '../config/ConfigService';
import type { PlayerStats } from '../config/types';
import type { PlayerProgressionUpdatePayload } from '../systems/PlayerProgressionSystem';

interface WaveStartedEventPayload {
    readonly waveNumber: number;
    readonly totalWaves: number;
}

interface WaveClearedEventPayload {
    readonly waveNumber: number;
    readonly totalWaves: number;
}

interface ResourceUpdatePayload {
    readonly current: number;
    readonly max: number;
}

type ResourceKind = 'level' | 'health' | 'mana' | 'experience';

interface HudResource {
    setValue(current: number, max: number, displayText?: string): void;
    setLevel(level: number, displayText?: string): void;
}

interface HudBehavior {
    getResource(kind: ResourceKind): HudResource;
    onProgressionUpdated(payload: PlayerProgressionUpdatePayload): void;
    onPlayerStatsInitialized(stats: PlayerStats): void;
    destroy(): void;
}

class NullHudResource implements HudResource {
    public setValue(_current: number, _max: number, _displayText?: string): void {
        // Null Object: não realiza nenhuma mutação de DOM.
    }

    public setLevel(_level: number, _displayText?: string): void {
        // Null Object: não realiza nenhuma mutação de DOM.
    }
}

class NullHudBehavior implements HudBehavior {
    private readonly nullResource: HudResource;

    public constructor() {
        this.nullResource = new NullHudResource();
    }

    public getResource(_kind: ResourceKind): HudResource {
        return this.nullResource;
    }

    public onProgressionUpdated(_payload: PlayerProgressionUpdatePayload): void {
        // Null Object: nenhuma atualização necessária sem HUD avançada.
    }

    public onPlayerStatsInitialized(_stats: PlayerStats): void {
        // Null Object: nenhuma atualização necessária sem HUD avançada.
    }

    public destroy(): void {
        // Null Object: nada para limpar.
    }
}

export class UIScene extends Scene {
    private static stylesInjected: boolean = false;

    private totalWaves: number = 0;
    private hudContainer!: Phaser.GameObjects.DOMElement;
    private hudElements!: {
        readonly wave: HTMLElement;
    };
    private readonly nullHudBehavior: HudBehavior;
    private hudBehavior: HudBehavior;

    constructor() {
        super('UIScene');
        this.nullHudBehavior = new NullHudBehavior();
        this.hudBehavior = this.nullHudBehavior;
    }

    public create(): void {
        const waveConfig = ConfigService.getInstance().getWaveConfig();
        this.totalWaves = waveConfig.totalWaves;

        this.ensureStylesInjected();
        this.createHud();

        const existingStats = this.game.registry.get('player-stats') as PlayerStats | undefined;
        if (existingStats) {
            this.onPlayerStatsInicializados(existingStats);
        }

        const currentHealth = this.game.registry.get('player-health') as number | undefined;
        const maxHealth = this.game.registry.get('player-max-health') as number | undefined;
        if (typeof currentHealth === 'number' && typeof maxHealth === 'number') {
            this.updateHealthText({ current: currentHealth, max: maxHealth });
        }

        const currentMana = this.game.registry.get('player-mana') as number | undefined;
        const maxMana = this.game.registry.get('player-max-mana') as number | undefined;
        if (typeof currentMana === 'number' && typeof maxMana === 'number') {
            this.updateManaText({ current: currentMana, max: maxMana });
        }

        this.game.events.on('player-health-changed', this.updateHealthText, this);
        this.game.events.on('player-mana-changed', this.updateManaText, this);
        this.game.events.on('player-progression-updated', this.onPlayerProgressionUpdated, this);
        this.game.events.on('wave-started', this.onWaveStarted, this);
        this.game.events.on('wave-cleared', this.onWaveCleared, this);
        this.game.events.on('all-waves-cleared', this.onAllWavesCleared, this);
        this.game.events.on('player-stats-inicializados', this.onPlayerStatsInicializados, this);

        this.events.on('shutdown', this.handleShutdown, this);
    }

    private ensureStylesInjected(): void {
        if (UIScene.stylesInjected) {
            return;
        }
        const styleElement: HTMLStyleElement = document.createElement('style');
        styleElement.setAttribute('data-origin', 'ui-scene');
        styleElement.textContent = `
            .hud-root {
                position: absolute;
                top: 0;
                left: 0;
                display: flex;
                flex-direction: column;
                gap: clamp(8px, 1.2vw, 16px);
                padding: clamp(8px, 1.4vw, 18px);
                width: auto;
                pointer-events: none;
                color: #ffffff;
                font-family: 'Trebuchet MS', sans-serif;
                text-shadow: 1px 1px 2px #000000;
                box-sizing: border-box;
                line-height: 1.35;
                font-size: 16px;
                max-width: 320px;
            }
            .hud-wave {
                background: rgba(9, 10, 15, 0.7);
                border: 1px solid rgba(255, 255, 255, 0.16);
                border-radius: 12px;
                padding: clamp(8px, 1.1vw, 14px) clamp(12px, 1.6vw, 18px);
                font-size: clamp(14px, 1.1vw + 10px, 18px);
                pointer-events: auto;
                backdrop-filter: blur(3px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
                align-self: flex-start;
            }
            @media (max-width: 768px) {
                .hud-root {
                    padding: 10px;
                    gap: clamp(8px, 2vw, 14px);
                }
                .hud-wave {
                    align-self: stretch;
                    text-align: center;
                }
            }
        `;
        document.head.appendChild(styleElement);
        UIScene.stylesInjected = true;
    }

    private createHud(): void {
        const dom = this.add.dom(0, 0);
        dom.setOrigin(0, 0).setScrollFactor(0).setDepth(100);
        dom.setPerspective(800);

        const html: string = `
            <div class="hud-root">
                <div class="hud-wave" data-hud="wave">Onda: 0/${this.totalWaves}</div>
            </div>
        `;
        dom.createFromHTML(html);

        const rootElement = dom.node as HTMLElement;
        const waveElement = this.queryHudElement(rootElement, '[data-hud="wave"]');
        this.hudElements = {
            wave: waveElement,
        };

        this.hudBehavior = this.nullHudBehavior;
        this.hudContainer = dom;
    }

    private queryHudElement(root: HTMLElement, selector: string): HTMLElement {
        const element = root.querySelector<HTMLElement>(selector);
        if (!element) {
            throw new Error(`Elemento HUD não encontrado: ${selector}`);
        }
        return element;
    }

    private updateHealthText(payload: ResourceUpdatePayload): void {
        if (this.hudBehavior === this.nullHudBehavior) {
            return;
        }
        const displayText: string = `${this.formatNumber(payload.current)} / ${this.formatNumber(payload.max)}`;
        this.hudBehavior.getResource('health').setValue(payload.current, payload.max, displayText);
    }

    private updateManaText(payload: ResourceUpdatePayload): void {
        if (this.hudBehavior === this.nullHudBehavior) {
            return;
        }
        const displayText: string = `${this.formatNumber(payload.current)} / ${this.formatNumber(payload.max)}`;
        this.hudBehavior.getResource('mana').setValue(payload.current, payload.max, displayText);
    }

    private onPlayerProgressionUpdated(payload: PlayerProgressionUpdatePayload): void {
        if (this.hudBehavior === this.nullHudBehavior) {
            return;
        }
        this.hudBehavior.onProgressionUpdated(payload);
    }

    private onWaveStarted(payload: WaveStartedEventPayload): void {
        this.hudElements.wave.textContent = this.formatWaveText(payload.waveNumber, payload.totalWaves);
    }

    private onWaveCleared(payload: WaveClearedEventPayload): void {
        this.hudElements.wave.textContent = this.formatWaveText(payload.waveNumber, payload.totalWaves);
    }

    private onAllWavesCleared(): void {
        this.hudElements.wave.textContent = 'Todas as ondas completas!';
    }

    private handleShutdown(): void {
        this.game.events.off('player-health-changed', this.updateHealthText, this);
        this.game.events.off('player-mana-changed', this.updateManaText, this);
        this.game.events.off('player-progression-updated', this.onPlayerProgressionUpdated, this);
        this.game.events.off('wave-started', this.onWaveStarted, this);
        this.game.events.off('wave-cleared', this.onWaveCleared, this);
        this.game.events.off('all-waves-cleared', this.onAllWavesCleared, this);
        this.game.events.off('player-stats-inicializados', this.onPlayerStatsInicializados, this);
        this.hudBehavior.destroy();
        this.hudBehavior = this.nullHudBehavior;

        if (this.hudContainer) {
            this.hudContainer.destroy();
        }
    }

    private formatWaveText(currentWave: number, totalWaves: number): string {
        return `Onda: ${currentWave}/${totalWaves}`;
    }

    private onPlayerStatsInicializados(stats: PlayerStats): void {
        if (this.hudBehavior !== this.nullHudBehavior) {
            this.onPlayerProgressionUpdated({
                level: stats.progressionState.level,
                experience: stats.progressionState.experience,
                experienceToNextLevel: stats.progressionState.experienceToNextLevel,
                availableAttributePoints: stats.progressionState.availableAttributePoints,
                primary: stats.primary,
                derived: stats.derived,
            });
        }
        this.hudBehavior.onPlayerStatsInitialized(stats);
        const currentHealth = (this.game.registry.get('player-health') as number | undefined) ?? stats.derived.maxHealth;
        this.updateHealthText({ current: currentHealth, max: stats.derived.maxHealth });
        const currentMana = (this.game.registry.get('player-mana') as number | undefined) ?? stats.derived.maxMana;
        this.updateManaText({ current: currentMana, max: stats.derived.maxMana });
    }

    private formatNumber(value: number): string {
        return Number.isInteger(value) ? value.toString() : value.toFixed(1);
    }
}
