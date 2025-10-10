import Phaser, { Scene } from 'phaser';
import { ConfigService } from '../config/ConfigService';
import type { DerivedAttributes, PlayerStats, PrimaryAttributes } from '../config/types';
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

const ATTRIBUTE_DEFINITIONS: ReadonlyArray<{ key: keyof PrimaryAttributes; label: string }> = [
    { key: 'strength', label: 'FOR' },
    { key: 'agility', label: 'AGI' },
    { key: 'vitality', label: 'VIT' },
    { key: 'intelligence', label: 'INT' },
    { key: 'dexterity', label: 'DES' },
];

type AttributeKey = (typeof ATTRIBUTE_DEFINITIONS)[number]['key'];
type ResourceKind = 'level' | 'health' | 'mana' | 'experience';

interface HudResourceBarOptions {
    readonly anchor: HTMLElement;
    readonly kind: ResourceKind;
    readonly label: string;
}

class HudResourceBar {
    private static clampRatio(value: number): number {
        if (Number.isNaN(value) || !Number.isFinite(value)) {
            return 0;
        }
        return Math.min(Math.max(value, 0), 1);
    }

    private readonly rootElement: HTMLDivElement;
    private readonly valueElement: HTMLSpanElement;

    public constructor(options: HudResourceBarOptions) {
        const rootElement: HTMLDivElement = document.createElement('div');
        rootElement.classList.add('hud-resource', `hud-resource--${options.kind}`);
        rootElement.style.setProperty('--resource-ratio', '0');

        const headerElement: HTMLDivElement = document.createElement('div');
        headerElement.classList.add('hud-resource__header');

        const labelElement: HTMLSpanElement = document.createElement('span');
        labelElement.classList.add('hud-resource__label');
        labelElement.textContent = options.label;

        const valueElement: HTMLSpanElement = document.createElement('span');
        valueElement.classList.add('hud-resource__value');
        valueElement.textContent = '--';

        headerElement.append(labelElement, valueElement);

        const trackElement: HTMLDivElement = document.createElement('div');
        trackElement.classList.add('hud-resource__track');

        const fillElement: HTMLDivElement = document.createElement('div');
        fillElement.classList.add('hud-resource__fill');
        trackElement.append(fillElement);

        rootElement.append(headerElement, trackElement);

        options.anchor.replaceChildren(rootElement);

        this.rootElement = rootElement;
        this.valueElement = valueElement;
    }

    public setValue(current: number, max: number, displayText?: string): void {
        const ratio: number = max > 0 ? HudResourceBar.clampRatio(current / max) : 0;
        this.rootElement.style.setProperty('--resource-ratio', ratio.toFixed(4));
        const text: string = displayText ?? `${Math.max(0, Math.floor(current))} / ${Math.max(0, Math.floor(max))}`;
        this.valueElement.textContent = text;
    }

    public setLevel(level: number, displayText?: string): void {
        const text: string = displayText ?? `${Math.max(0, Math.floor(level))}`;
        this.rootElement.style.setProperty('--resource-ratio', '1');
        this.valueElement.textContent = text;
    }
}

export class UIScene extends Scene {
    private static stylesInjected: boolean = false;

    private totalWaves: number = 0;
    private hudContainer!: Phaser.GameObjects.DOMElement;
    private statusElements!: {
        readonly wave: HTMLElement;
        readonly availablePoints: HTMLElement;
        readonly derived: HTMLElement;
    };
    private resourceBars!: Map<ResourceKind, HudResourceBar>;
    private readonly attributeValueElements: Map<AttributeKey, HTMLElement> = new Map();
    private readonly attributeButtons: Map<AttributeKey, HTMLButtonElement> = new Map();
    private attributePanelElement!: HTMLElement;
    private levelUpOverlayElement!: HTMLElement;
    private lastAvailableAttributePoints: number = 0;
    private readonly onAttributeButtonClicked: (event: Event) => void;

    constructor() {
        super('UIScene');
        this.onAttributeButtonClicked = (event: Event): void => {
            const target = event.currentTarget as HTMLButtonElement | null;
            const attributeKey = target?.dataset.attribute as AttributeKey | undefined;
            if (!attributeKey) {
                return;
            }
            this.game.events.emit('attribute-allocation-requested', { attribute: attributeKey });
        };
    }

    public create(): void {
        const waveConfig = ConfigService.getInstance().getWaveConfig();
        this.totalWaves = waveConfig.totalWaves;

        this.ensureStylesInjected();
        this.createHud();
        this.updateHudScaling(this.scale.gameSize);
        this.scale.on('resize', this.updateHudScaling, this);

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
                width: min(100%, 520px);
                pointer-events: none;
                color: #ffffff;
                font-family: 'Trebuchet MS', sans-serif;
                text-shadow: 1px 1px 2px #000000;
                box-sizing: border-box;
                line-height: 1.35;
                font-size: calc(16px * var(--hud-font-scale, 1));
            }
            .hud-top {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: clamp(8px, 1vw, 16px);
                pointer-events: none;
            }
            .hud-status {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: clamp(6px, 1vw, 14px);
                background: rgba(9, 10, 15, 0.7);
                border: 1px solid rgba(255, 255, 255, 0.16);
                border-radius: 12px;
                padding: clamp(10px, 1.4vw, 16px);
                pointer-events: auto;
                backdrop-filter: blur(3px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
            }
            .hud-status__item {
                min-width: 0;
                font-size: clamp(13px, 1vw + 10px, 17px);
                font-weight: 600;
                letter-spacing: 0.02em;
            }
            .hud-resource {
                --resource-ratio: 0;
                --hud-resource-track-height: calc(12px * var(--hud-font-scale, 1));
                --hud-resource-fill: linear-gradient(135deg, #4dabf7, #1c7ed6);
                --hud-resource-glow: 0 0 10px rgba(76, 154, 255, 0.4);
                display: flex;
                flex-direction: column;
                gap: clamp(6px, 0.8vw, 10px);
                padding: clamp(8px, 1.1vw, 12px);
                background: rgba(17, 21, 32, 0.7);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 10px;
                box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 6px 12px rgba(0, 0, 0, 0.35);
            }
            .hud-resource__header {
                display: flex;
                align-items: baseline;
                justify-content: space-between;
                gap: 10px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            .hud-resource__label {
                font-size: clamp(12px, 0.8vw + 8px, 16px);
                color: rgba(255, 255, 255, 0.88);
            }
            .hud-resource__label::after {
                content: ':';
                margin-left: 4px;
                color: rgba(255, 255, 255, 0.6);
            }
            .hud-resource__value {
                font-size: clamp(12px, 0.8vw + 8px, 16px);
                font-weight: 700;
                color: #ffffff;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
            }
            .hud-resource__track {
                position: relative;
                width: 100%;
                height: var(--hud-resource-track-height, 14px);
                border-radius: 999px;
                background: linear-gradient(135deg, rgba(17, 21, 32, 0.9), rgba(11, 13, 20, 0.8));
                overflow: hidden;
                box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.45);
            }
            .hud-resource__fill {
                width: calc(var(--resource-ratio, 0) * 100%);
                height: 100%;
                border-radius: inherit;
                background: var(--hud-resource-fill);
                box-shadow: var(--hud-resource-glow);
                transition: width 160ms ease-out;
            }
            .hud-resource--level {
                --hud-resource-fill: linear-gradient(135deg, #ffe066, #f0b429);
                --hud-resource-glow: 0 0 14px rgba(255, 224, 102, 0.35);
            }
            .hud-resource--health {
                --hud-resource-fill: linear-gradient(135deg, #ff6b6b, #c92a2a);
                --hud-resource-glow: 0 0 14px rgba(255, 107, 107, 0.4);
            }
            .hud-resource--mana {
                --hud-resource-fill: linear-gradient(135deg, #74c0fc, #4dabf7);
                --hud-resource-glow: 0 0 14px rgba(116, 192, 252, 0.4);
            }
            .hud-resource--experience {
                --hud-resource-fill: linear-gradient(135deg, #b197fc, #845ef7);
                --hud-resource-glow: 0 0 14px rgba(180, 151, 252, 0.4);
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
            }
            .hud-attribute-panel {
                position: relative;
                width: min(92vw, 360px);
                background: rgba(12, 12, 18, 0.92);
                border: 1px solid rgba(255, 255, 255, 0.22);
                border-radius: 14px;
                padding: clamp(16px, 2vw, 22px);
                display: none;
                flex-direction: column;
                gap: 14px;
                pointer-events: auto;
                animation: hud-pop 220ms ease-out;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45);
            }
            .hud-attribute-panel--visible {
                display: flex;
            }
            .hud-attribute-panel h2 {
                margin: 0;
                font-size: clamp(16px, 1.3vw + 10px, 22px);
                color: #ffe066;
            }
            .hud-attribute-panel__points {
                font-size: clamp(14px, 1vw + 10px, 18px);
                color: #8aff8a;
            }
            .hud-attribute-list {
                display: flex;
                flex-direction: column;
                gap: clamp(8px, 1.2vw, 14px);
            }
            .hud-attribute-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                font-size: clamp(13px, 1vw + 9px, 17px);
            }
            .hud-attribute-row button {
                background: linear-gradient(135deg, #2ecc71, #27ae60);
                border: none;
                color: #ffffff;
                padding: 6px 10px;
                border-radius: 6px;
                cursor: pointer;
                transition: transform 120ms ease, box-shadow 120ms ease, background 160ms ease;
                font-weight: 700;
            }
            .hud-attribute-row button:disabled {
                background: #3d4a3f;
                cursor: not-allowed;
                opacity: 0.7;
                box-shadow: none;
            }
            .hud-attribute-row button:not(:disabled):hover {
                transform: translateY(-1px);
                box-shadow: 0 8px 14px rgba(46, 204, 113, 0.35);
            }
            .hud-derived {
                font-size: clamp(12px, 1vw + 8px, 16px);
                line-height: 1.45;
                color: #d5e4ff;
            }
            .hud-levelup-overlay {
                position: absolute;
                inset: 0;
                display: none;
                align-items: center;
                justify-content: center;
                padding: clamp(16px, 2vw, 28px);
                pointer-events: auto;
            }
            .hud-levelup-overlay--visible {
                display: flex;
            }
            .hud-levelup-overlay__backdrop {
                position: absolute;
                inset: 0;
                background: rgba(0, 0, 0, 0.65);
                pointer-events: auto;
            }
            .hud-levelup-overlay__content {
                position: relative;
                z-index: 1;
                display: flex;
                flex-direction: column;
                gap: clamp(16px, 2vw, 24px);
                align-items: center;
                text-align: center;
                width: 100%;
                max-width: min(92vw, 420px);
            }
            .hud-levelup-overlay__message {
                font-size: clamp(16px, 1.4vw + 11px, 22px);
                color: #ffe066;
                text-shadow: 2px 2px 3px #000000;
                pointer-events: none;
                line-height: 1.4;
            }
            @keyframes hud-pop {
                from {
                    transform: translateY(12px) scale(0.97);
                    opacity: 0;
                }
                to {
                    transform: translateY(0) scale(1);
                    opacity: 1;
                }
            }
            @media (max-width: 768px) {
                .hud-root {
                    width: min(100%, 420px);
                    gap: 10px;
                }
                .hud-top {
                    flex-direction: column;
                    align-items: stretch;
                }
                .hud-wave {
                    align-self: stretch;
                    text-align: center;
                }
                .hud-levelup-overlay {
                    align-items: flex-end;
                }
                .hud-levelup-overlay__content {
                    align-items: stretch;
                }
            }
            @media (max-width: 480px) {
                .hud-root {
                    padding: 10px;
                }
                .hud-status {
                    grid-template-columns: 1fr;
                }
                .hud-levelup-overlay {
                    padding-bottom: 24px;
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
                <div class="hud-top">
                    <div class="hud-status">
                        <div class="hud-status__item" data-hud-resource="level"></div>
                        <div class="hud-status__item" data-hud-resource="health"></div>
                        <div class="hud-status__item" data-hud-resource="mana"></div>
                        <div class="hud-status__item" data-hud-resource="experience"></div>
                    </div>
                    <div class="hud-wave" data-hud="wave">Onda: 0/${this.totalWaves}</div>
                </div>
                <div class="hud-levelup-overlay" data-hud="overlay">
                    <div class="hud-levelup-overlay__backdrop"></div>
                    <div class="hud-levelup-overlay__content">
                        <div class="hud-levelup-overlay__message">Novo nível alcançado! Distribua seus pontos.</div>
                        <div class="hud-attribute-panel" data-hud="attribute-panel">
                            <div>
                                <h2>Atributos Primários</h2>
                                <div class="hud-attribute-panel__points" data-hud="available-points">Pontos disponíveis: 0</div>
                            </div>
                            <div class="hud-attribute-list">
                                ${ATTRIBUTE_DEFINITIONS.map(
                                    definition => `
                                        <div class="hud-attribute-row">
                                            <span>${definition.label}: <strong data-attribute-value="${definition.key}">--</strong></span>
                                            <button type="button" data-attribute-button data-attribute="${definition.key}" disabled>+</button>
                                        </div>
                                    `.trim(),
                                ).join('')}
                            </div>
                            <div class="hud-derived" data-hud="derived">Derivados: --</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        dom.createFromHTML(html);

        const rootElement = dom.node as HTMLElement;
        rootElement.style.setProperty('--hud-font-scale', '1');
        const waveElement = this.queryHudElement(rootElement, '[data-hud="wave"]');
        const availablePointsElement = this.queryHudElement(rootElement, '[data-hud="available-points"]');
        const derivedElement = this.queryHudElement(rootElement, '[data-hud="derived"]');
        const attributePanel = this.queryHudElement(rootElement, '[data-hud="attribute-panel"]');
        const overlayElement = this.queryHudElement(rootElement, '[data-hud="overlay"]');

        const levelAnchor = this.queryHudElement(rootElement, '[data-hud-resource="level"]');
        const healthAnchor = this.queryHudElement(rootElement, '[data-hud-resource="health"]');
        const manaAnchor = this.queryHudElement(rootElement, '[data-hud-resource="mana"]');
        const experienceAnchor = this.queryHudElement(rootElement, '[data-hud-resource="experience"]');

        this.statusElements = {
            wave: waveElement,
            availablePoints: availablePointsElement,
            derived: derivedElement,
        };
        this.attributePanelElement = attributePanel;
        this.levelUpOverlayElement = overlayElement;

        this.resourceBars = new Map<ResourceKind, HudResourceBar>();
        this.resourceBars.set('level', new HudResourceBar({ anchor: levelAnchor, kind: 'level', label: 'Nível' }));
        this.resourceBars.set('health', new HudResourceBar({ anchor: healthAnchor, kind: 'health', label: 'HP' }));
        this.resourceBars.set('mana', new HudResourceBar({ anchor: manaAnchor, kind: 'mana', label: 'MP' }));
        this.resourceBars.set(
            'experience',
            new HudResourceBar({ anchor: experienceAnchor, kind: 'experience', label: 'XP' }),
        );

        this.resourceBars.get('level')?.setLevel(1);
        this.resourceBars.get('health')?.setValue(0, 0, '0 / 0');
        this.resourceBars.get('mana')?.setValue(0, 0, '0 / 0');
        this.resourceBars.get('experience')?.setValue(0, 0, '0 / 0');

        ATTRIBUTE_DEFINITIONS.forEach(definition => {
            const valueSelector = `[data-attribute-value="${definition.key}"]`;
            const buttonSelector = `button[data-attribute="${definition.key}"]`;
            const valueElement = this.queryHudElement(rootElement, valueSelector);
            const buttonElement = this.queryHudButton(rootElement, buttonSelector);
            buttonElement.addEventListener('click', this.onAttributeButtonClicked);
            this.attributeValueElements.set(definition.key, valueElement);
            this.attributeButtons.set(definition.key, buttonElement);
        });

        this.hudContainer = dom;
    }

    private updateHudScaling(
        gameSize: Phaser.Structs.Size,
        _baseSize?: Phaser.Structs.Size,
        _displaySize?: Phaser.Structs.Size,
        _resolution?: number,
    ): void {
        if (!this.hudContainer) {
            return;
        }
        const rootElement = this.hudContainer.node as HTMLElement;
        const baseWidth = 1280;
        const baseHeight = 720;
        const widthRatio = gameSize.width / baseWidth;
        const heightRatio = gameSize.height / baseHeight;
        const fontScale = Phaser.Math.Clamp(Math.min(widthRatio, heightRatio), 0.75, 1.2);
        rootElement.style.setProperty('--hud-font-scale', fontScale.toFixed(3));
        const trackHeight = Phaser.Math.Clamp(12 * fontScale, 8, 18);
        rootElement.style.setProperty('--hud-resource-track-height', `${trackHeight.toFixed(2)}px`);
        const targetMaxWidth = Math.min(520 * fontScale, Math.max(gameSize.width - 24, 280));
        rootElement.style.maxWidth = `${targetMaxWidth}px`;
    }

    private queryHudElement(root: HTMLElement, selector: string): HTMLElement {
        const element = root.querySelector<HTMLElement>(selector);
        if (!element) {
            throw new Error(`Elemento HUD não encontrado: ${selector}`);
        }
        return element;
    }

    private queryHudButton(root: HTMLElement, selector: string): HTMLButtonElement {
        const element = root.querySelector<HTMLButtonElement>(selector);
        if (!element) {
            throw new Error(`Botão HUD não encontrado: ${selector}`);
        }
        return element;
    }

    private getResourceBar(kind: ResourceKind): HudResourceBar | undefined {
        return this.resourceBars?.get(kind);
    }

    private updateHealthText(payload: ResourceUpdatePayload): void {
        const healthBar = this.getResourceBar('health');
        if (!healthBar) {
            return;
        }
        const displayText: string = `${this.formatNumber(payload.current)} / ${this.formatNumber(payload.max)}`;
        healthBar.setValue(payload.current, payload.max, displayText);
    }

    private updateManaText(payload: ResourceUpdatePayload): void {
        const manaBar = this.getResourceBar('mana');
        if (!manaBar) {
            return;
        }
        const displayText: string = `${this.formatNumber(payload.current)} / ${this.formatNumber(payload.max)}`;
        manaBar.setValue(payload.current, payload.max, displayText);
    }

    private onPlayerProgressionUpdated(payload: PlayerProgressionUpdatePayload): void {
        this.getResourceBar('level')?.setLevel(payload.level);
        const experienceBar = this.getResourceBar('experience');
        if (experienceBar) {
            const formattedExperience: string = `${this.formatNumber(payload.experience)} / ${this.formatNumber(
                payload.experienceToNextLevel,
            )}`;
            experienceBar.setValue(payload.experience, payload.experienceToNextLevel, formattedExperience);
        }
        this.statusElements.availablePoints.textContent = `Pontos disponíveis: ${payload.availableAttributePoints}`;
        this.updateAttributeValues(payload.primary);
        this.statusElements.derived.textContent = this.formatDerivedText(payload.derived);
        this.toggleAttributeButtons(payload.availableAttributePoints > 0);
        this.updateLevelUpPanelVisibility(payload.availableAttributePoints);
        this.lastAvailableAttributePoints = payload.availableAttributePoints;
    }

    private onWaveStarted(payload: WaveStartedEventPayload): void {
        this.statusElements.wave.textContent = this.formatWaveText(payload.waveNumber, payload.totalWaves);
    }

    private onWaveCleared(payload: WaveClearedEventPayload): void {
        this.statusElements.wave.textContent = this.formatWaveText(payload.waveNumber, payload.totalWaves);
    }

    private onAllWavesCleared(): void {
        this.statusElements.wave.textContent = 'Todas as ondas completas!';
    }

    private handleShutdown(): void {
        this.game.events.off('player-health-changed', this.updateHealthText, this);
        this.game.events.off('player-mana-changed', this.updateManaText, this);
        this.game.events.off('player-progression-updated', this.onPlayerProgressionUpdated, this);
        this.game.events.off('wave-started', this.onWaveStarted, this);
        this.game.events.off('wave-cleared', this.onWaveCleared, this);
        this.game.events.off('all-waves-cleared', this.onAllWavesCleared, this);
        this.game.events.off('player-stats-inicializados', this.onPlayerStatsInicializados, this);
        this.scale.off('resize', this.updateHudScaling, this);

        this.attributeButtons.forEach(button => {
            button.removeEventListener('click', this.onAttributeButtonClicked);
        });
        this.attributeButtons.clear();
        this.attributeValueElements.clear();

        this.resourceBars?.clear();

        if (this.hudContainer) {
            this.hudContainer.destroy();
        }
    }

    private formatWaveText(currentWave: number, totalWaves: number): string {
        return `Onda: ${currentWave}/${totalWaves}`;
    }

    private onPlayerStatsInicializados(stats: PlayerStats): void {
        this.onPlayerProgressionUpdated({
            level: stats.progressionState.level,
            experience: stats.progressionState.experience,
            experienceToNextLevel: stats.progressionState.experienceToNextLevel,
            availableAttributePoints: stats.progressionState.availableAttributePoints,
            primary: stats.primary,
            derived: stats.derived,
        });
        const currentHealth = (this.game.registry.get('player-health') as number | undefined) ?? stats.derived.maxHealth;
        this.updateHealthText({ current: currentHealth, max: stats.derived.maxHealth });
        const currentMana = (this.game.registry.get('player-mana') as number | undefined) ?? stats.derived.maxMana;
        this.updateManaText({ current: currentMana, max: stats.derived.maxMana });
    }

    private updateAttributeValues(primary: PrimaryAttributes): void {
        ATTRIBUTE_DEFINITIONS.forEach(definition => {
            const valueElement = this.attributeValueElements.get(definition.key);
            if (!valueElement) {
                return;
            }
            valueElement.textContent = `${primary[definition.key]}`;
        });
    }

    private toggleAttributeButtons(canAllocate: boolean): void {
        this.attributeButtons.forEach(button => {
            button.disabled = !canAllocate;
        });
    }

    private updateLevelUpPanelVisibility(availablePoints: number): void {
        const hasPoints: boolean = availablePoints > 0;
        const isPanelVisible: boolean = this.attributePanelElement.classList.contains('hud-attribute-panel--visible');
        if (hasPoints && (!isPanelVisible || this.lastAvailableAttributePoints === 0)) {
            this.attributePanelElement.classList.add('hud-attribute-panel--visible');
            this.levelUpOverlayElement.classList.add('hud-levelup-overlay--visible');
        } else if (!hasPoints && isPanelVisible) {
            this.attributePanelElement.classList.remove('hud-attribute-panel--visible');
            this.levelUpOverlayElement.classList.remove('hud-levelup-overlay--visible');
        }
    }

    private formatDerivedText(derived: DerivedAttributes): string {
        return `Derivados: HP ${derived.maxHealth} | MP ${derived.maxMana} | ATQ ${this.formatNumber(derived.physicalAttack)} | DEF ${this.formatNumber(derived.physicalDefense)} | CRIT ${this.formatNumber(derived.criticalChance)}% | ASPD ${this.formatNumber(derived.attackSpeed)}/s`;
    }

    private formatNumber(value: number): string {
        return Number.isInteger(value) ? value.toString() : value.toFixed(1);
    }
}
