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

class BasicHudResource implements HudResource {
    private readonly valueElement: HTMLElement;
    private readonly fillElement?: HTMLElement;
    private readonly extraElements: readonly HTMLElement[];

    public constructor(valueElement: HTMLElement, fillElement?: HTMLElement, extraElements: readonly HTMLElement[] = []) {
        this.valueElement = valueElement;
        this.fillElement = fillElement;
        this.extraElements = extraElements;
    }

    public setValue(current: number, max: number, displayText?: string): void {
        const safeMax = Math.max(max, 0);
        const percentage = safeMax > 0 ? Math.min(Math.max(current / safeMax, 0), 1) : 0;
        this.valueElement.textContent = displayText ?? `${current}/${max}`;
        if (this.fillElement) {
            this.fillElement.style.width = `${percentage * 100}%`;
            this.fillElement.setAttribute('aria-valuemin', '0');
            this.fillElement.setAttribute('aria-valuenow', current.toString());
            this.fillElement.setAttribute('aria-valuemax', safeMax.toString());
        }
    }

    public setLevel(level: number, displayText?: string): void {
        this.valueElement.textContent = displayText ?? level.toString();
        for (const element of this.extraElements) {
            element.setAttribute('data-level', level.toString());
        }
    }

    public reset(): void {
        this.valueElement.textContent = '';
        if (this.fillElement) {
            this.fillElement.style.width = '0%';
            this.fillElement.setAttribute('aria-valuemin', '0');
            this.fillElement.setAttribute('aria-valuenow', '0');
            this.fillElement.setAttribute('aria-valuemax', '0');
        }
        for (const element of this.extraElements) {
            element.removeAttribute('data-level');
        }
    }
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

interface HudElements {
    readonly wave: HTMLElement;
    readonly healthValue: HTMLElement;
    readonly healthFill: HTMLElement;
    readonly manaValue: HTMLElement;
    readonly manaFill: HTMLElement;
    readonly levelValue: HTMLElement;
    readonly experienceValue: HTMLElement;
    readonly experienceFill: HTMLElement;
    readonly attributePointsValue: HTMLElement;
}

interface BasicHudBehaviorConfig {
    readonly elements: HudElements;
    readonly formatNumber: (value: number) => string;
}

class BasicHudBehavior implements HudBehavior {
    private readonly resources: Record<ResourceKind, HudResource>;
    private readonly attributePointsElement: HTMLElement;
    private readonly formatNumber: (value: number) => string;

    public constructor(config: BasicHudBehaviorConfig) {
        const { elements, formatNumber } = config;
        this.resources = {
            level: new BasicHudResource(elements.levelValue),
            health: new BasicHudResource(elements.healthValue, elements.healthFill),
            mana: new BasicHudResource(elements.manaValue, elements.manaFill),
            experience: new BasicHudResource(elements.experienceValue, elements.experienceFill),
        };
        this.attributePointsElement = elements.attributePointsValue;
        this.formatNumber = formatNumber;
    }

    public getResource(kind: ResourceKind): HudResource {
        const resource = this.resources[kind];
        if (!resource) {
            throw new Error(`Recurso HUD não registrado: ${kind}`);
        }
        return resource;
    }

    public onProgressionUpdated(payload: PlayerProgressionUpdatePayload): void {
        const levelText: string = `Nível: ${payload.level}`;
        this.getResource('level').setLevel(payload.level, levelText);

        const experienceDisplay: string = `XP: ${this.formatNumber(payload.experience)} / ${this.formatNumber(payload.experienceToNextLevel)}`;
        this.getResource('experience').setValue(
            payload.experience,
            payload.experienceToNextLevel,
            experienceDisplay,
        );

        this.attributePointsElement.textContent = `Pontos não distribuídos: ${payload.availableAttributePoints}`;
    }

    public onPlayerStatsInitialized(stats: PlayerStats): void {
        const healthDisplay: string = `${this.formatNumber(stats.derived.maxHealth)} / ${this.formatNumber(stats.derived.maxHealth)}`;
        this.getResource('health').setValue(stats.derived.maxHealth, stats.derived.maxHealth, `Vida: ${healthDisplay}`);

        const manaDisplay: string = `${this.formatNumber(stats.derived.maxMana)} / ${this.formatNumber(stats.derived.maxMana)}`;
        this.getResource('mana').setValue(stats.derived.maxMana, stats.derived.maxMana, `Mana: ${manaDisplay}`);
    }

    public destroy(): void {
        (Object.keys(this.resources) as ResourceKind[]).forEach((key) => {
            const resource = this.resources[key];
            if (resource instanceof BasicHudResource) {
                resource.reset();
            }
        });
        this.attributePointsElement.textContent = '';
    }
}

export class UIScene extends Scene {
    private static stylesInjected: boolean = false;

    private totalWaves: number = 0;
    private hudContainer: Phaser.GameObjects.DOMElement | null = null;
    private hudElements: HudElements | null = null;
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
            .hud-section {
                display: flex;
                flex-direction: column;
                gap: clamp(6px, 1vw, 10px);
            }
            .hud-resource {
                background: rgba(12, 13, 20, 0.72);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 10px;
                padding: clamp(8px, 1vw, 12px) clamp(10px, 1.2vw, 14px);
                display: flex;
                flex-direction: column;
                gap: clamp(6px, 1vw, 10px);
            }
            .hud-resource__header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-weight: 600;
                letter-spacing: 0.4px;
            }
            .hud-resource__bar {
                position: relative;
                width: 100%;
                height: 10px;
                border-radius: 999px;
                overflow: hidden;
                background: rgba(255, 255, 255, 0.12);
            }
            .hud-resource__bar-fill {
                position: absolute;
                top: 0;
                left: 0;
                height: 100%;
                width: 0%;
                transition: width 150ms ease-out;
            }
            .hud-resource__bar-fill[data-kind='health'] {
                background: linear-gradient(90deg, #e53935, #ff7043);
            }
            .hud-resource__bar-fill[data-kind='mana'] {
                background: linear-gradient(90deg, #1e88e5, #42a5f5);
            }
            .hud-resource__bar-fill[data-kind='experience'] {
                background: linear-gradient(90deg, #fbc02d, #fdd835);
            }
            .hud-summary {
                background: rgba(9, 10, 15, 0.7);
                border: 1px solid rgba(255, 255, 255, 0.16);
                border-radius: 12px;
                padding: clamp(8px, 1.1vw, 14px) clamp(12px, 1.4vw, 18px);
                display: flex;
                flex-direction: column;
                gap: 6px;
            }
            .hud-summary__item {
                display: flex;
                justify-content: space-between;
                font-size: clamp(13px, 1vw + 10px, 16px);
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
                <div class="hud-section">
                    <div class="hud-resource" data-hud="resource-health">
                        <div class="hud-resource__header">
                            <span>Vida</span>
                            <span data-hud="health-value">Vida: 0 / 0</span>
                        </div>
                        <div class="hud-resource__bar" role="presentation">
                            <div
                                class="hud-resource__bar-fill"
                                data-kind="health"
                                data-hud="health-fill"
                                role="progressbar"
                                aria-valuemin="0"
                                aria-valuenow="0"
                                aria-valuemax="0"
                            ></div>
                        </div>
                    </div>
                    <div class="hud-resource" data-hud="resource-mana">
                        <div class="hud-resource__header">
                            <span>Mana</span>
                            <span data-hud="mana-value">Mana: 0 / 0</span>
                        </div>
                        <div class="hud-resource__bar" role="presentation">
                            <div
                                class="hud-resource__bar-fill"
                                data-kind="mana"
                                data-hud="mana-fill"
                                role="progressbar"
                                aria-valuemin="0"
                                aria-valuenow="0"
                                aria-valuemax="0"
                            ></div>
                        </div>
                    </div>
                    <div class="hud-resource" data-hud="resource-experience">
                        <div class="hud-resource__header">
                            <span>Experiência</span>
                            <span data-hud="experience-value">XP: 0 / 0</span>
                        </div>
                        <div class="hud-resource__bar" role="presentation">
                            <div
                                class="hud-resource__bar-fill"
                                data-kind="experience"
                                data-hud="experience-fill"
                                role="progressbar"
                                aria-valuemin="0"
                                aria-valuenow="0"
                                aria-valuemax="0"
                            ></div>
                        </div>
                    </div>
                </div>
                <div class="hud-summary">
                    <div class="hud-summary__item">
                        <span>Nível</span>
                        <span data-hud="level-value">Nível: 1</span>
                    </div>
                    <div class="hud-summary__item" data-hud="attribute-points">Pontos não distribuídos: 0</div>
                </div>
            </div>
        `;
        dom.createFromHTML(html);

        const rootElement = dom.node as HTMLElement;
        const waveElement = this.queryHudElement(rootElement, '[data-hud="wave"]');
        const healthValueElement = this.queryHudElement(rootElement, '[data-hud="health-value"]');
        const healthFillElement = this.queryHudElement(rootElement, '[data-hud="health-fill"]');
        const manaValueElement = this.queryHudElement(rootElement, '[data-hud="mana-value"]');
        const manaFillElement = this.queryHudElement(rootElement, '[data-hud="mana-fill"]');
        const levelValueElement = this.queryHudElement(rootElement, '[data-hud="level-value"]');
        const experienceValueElement = this.queryHudElement(rootElement, '[data-hud="experience-value"]');
        const experienceFillElement = this.queryHudElement(rootElement, '[data-hud="experience-fill"]');
        const attributePointsElement = this.queryHudElement(rootElement, '[data-hud="attribute-points"]');

        this.hudElements = {
            wave: waveElement,
            healthValue: healthValueElement,
            healthFill: healthFillElement,
            manaValue: manaValueElement,
            manaFill: manaFillElement,
            levelValue: levelValueElement,
            experienceValue: experienceValueElement,
            experienceFill: experienceFillElement,
            attributePointsValue: attributePointsElement,
        };

        this.hudBehavior = new BasicHudBehavior({
            elements: this.hudElements,
            formatNumber: this.formatNumber.bind(this),
        });
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
        const displayText: string = `Vida: ${this.formatNumber(payload.current)} / ${this.formatNumber(payload.max)}`;
        this.hudBehavior.getResource('health').setValue(payload.current, payload.max, displayText);
    }

    private updateManaText(payload: ResourceUpdatePayload): void {
        if (this.hudBehavior === this.nullHudBehavior) {
            return;
        }
        const displayText: string = `Mana: ${this.formatNumber(payload.current)} / ${this.formatNumber(payload.max)}`;
        this.hudBehavior.getResource('mana').setValue(payload.current, payload.max, displayText);
    }

    private onPlayerProgressionUpdated(payload: PlayerProgressionUpdatePayload): void {
        if (this.hudBehavior === this.nullHudBehavior) {
            return;
        }
        this.hudBehavior.onProgressionUpdated(payload);
    }

    private onWaveStarted(payload: WaveStartedEventPayload): void {
        if (!this.hudElements) {
            return;
        }
        this.hudElements.wave.textContent = this.formatWaveText(payload.waveNumber, payload.totalWaves);
    }

    private onWaveCleared(payload: WaveClearedEventPayload): void {
        if (!this.hudElements) {
            return;
        }
        this.hudElements.wave.textContent = this.formatWaveText(payload.waveNumber, payload.totalWaves);
    }

    private onAllWavesCleared(): void {
        if (!this.hudElements) {
            return;
        }
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
            const root = this.hudContainer.node as HTMLElement;
            root.replaceChildren();
            this.hudContainer.destroy();
            this.hudContainer = null;
        }
        this.hudElements = null;
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
