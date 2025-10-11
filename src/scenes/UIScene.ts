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

type NumberFormatter = (value: number) => string;

interface HudResourceElements {
    readonly fill: HTMLElement;
    readonly text: HTMLElement;
}

class TransformHudResource implements HudResource {
    private readonly axis: 'X' | 'Y';
    private readonly formatNumber: NumberFormatter;
    private lastRatio: number | null = null;
    private lastText: string = '';

    public constructor(axis: 'X' | 'Y', elements: HudResourceElements, formatNumber: NumberFormatter) {
        this.axis = axis;
        this.elements = elements;
        this.formatNumber = formatNumber;
    }

    private readonly elements: HudResourceElements;

    public setValue(current: number, max: number, displayText?: string): void {
        const denominator: number = max > 0 ? max : 1;
        const clampedRatio: number = Phaser.Math.Clamp(current / denominator, 0, 1);
        if (this.lastRatio === null || Math.abs(clampedRatio - this.lastRatio) > 0.001) {
            this.lastRatio = clampedRatio;
            const transformValue: string = this.axis === 'Y' ? `scaleY(${clampedRatio})` : `scaleX(${clampedRatio})`;
            this.elements.fill.style.transform = transformValue;
        }

        const renderedText: string = displayText ?? `${this.formatNumber(current)} / ${this.formatNumber(max)}`;
        if (renderedText !== this.lastText) {
            this.lastText = renderedText;
            this.elements.text.textContent = renderedText;
        }
    }

    public setLevel(_level: number, _displayText?: string): void {
        // Este recurso não exibe nível; nenhum efeito necessário.
    }
}

class LevelHudResource implements HudResource {
    private readonly element: HTMLElement;
    private lastLevel: number | null = null;
    private lastText: string = '';

    public constructor(element: HTMLElement) {
        this.element = element;
    }

    public setValue(_current: number, _max: number, _displayText?: string): void {
        // O recurso de nível não possui barra de preenchimento.
    }

    public setLevel(level: number, displayText?: string): void {
        if (this.lastLevel === level && (!displayText || displayText === this.lastText)) {
            return;
        }
        this.lastLevel = level;
        const textToRender: string = displayText ?? level.toString();
        this.lastText = textToRender;
        this.element.textContent = textToRender;
    }
}

class BottomBarHudBehavior implements HudBehavior {
    private readonly resources: Map<ResourceKind, HudResource>;
    private readonly attributeContainer: HTMLElement;
    private readonly attributeText: HTMLElement;
    private readonly attributeButton: HTMLButtonElement;
    private readonly disposers: Array<() => void>;
    private readonly scene: UIScene;
    private readonly formatNumber: NumberFormatter;

    public constructor(rootElement: HTMLElement, scene: UIScene, formatNumber: NumberFormatter) {
        this.scene = scene;
        this.formatNumber = formatNumber;
        this.disposers = [];

        const healthElements: HudResourceElements = this.extractResourceElements(rootElement, 'health');
        const manaElements: HudResourceElements = this.extractResourceElements(rootElement, 'mana');
        const experienceElements: HudResourceElements = this.extractResourceElements(rootElement, 'experience');
        const levelElement = this.queryElement<HTMLElement>(rootElement, '[data-hud="level"]');

        this.attributeContainer = this.queryElement<HTMLElement>(rootElement, '[data-hud="attributes"]');
        this.attributeText = this.queryElement<HTMLElement>(this.attributeContainer, '[data-hud="attributes-text"]');
        this.attributeButton = this.queryElement<HTMLButtonElement>(this.attributeContainer, '[data-action="open-attributes"]');

        this.resources = new Map<ResourceKind, HudResource>([
            ['health', new TransformHudResource('Y', healthElements, this.formatNumber)],
            ['mana', new TransformHudResource('Y', manaElements, this.formatNumber)],
            ['experience', new TransformHudResource('X', experienceElements, this.formatNumber)],
            ['level', new LevelHudResource(levelElement)],
        ]);

        const handleAttributesClick = (): void => {
            this.scene.events.emit('hud-open-attributes-requested');
        };
        this.attributeButton.addEventListener('click', handleAttributesClick);
        this.disposers.push(() => this.attributeButton.removeEventListener('click', handleAttributesClick));

        const keyboardManager = this.scene.input.keyboard;
        if (keyboardManager) {
            const attributeKey: Phaser.Input.Keyboard.Key = keyboardManager.addKey(Phaser.Input.Keyboard.KeyCodes.P, false, false);
            const handleKeyDown = (): void => {
                this.scene.events.emit('hud-open-attributes-requested');
            };
            attributeKey.on('down', handleKeyDown);
            this.disposers.push(() => {
                attributeKey.off('down', handleKeyDown);
                keyboardManager.removeKey(attributeKey.keyCode, false);
            });
        }
    }

    private extractResourceElements(root: HTMLElement, kind: Exclude<ResourceKind, 'level'>): HudResourceElements {
        const resourceRoot = this.queryElement<HTMLElement>(root, `[data-resource="${kind}"]`);
        const fill = this.queryElement<HTMLElement>(resourceRoot, '[data-role="fill"]');
        const text = this.queryElement<HTMLElement>(resourceRoot, '[data-role="text"]');
        return { fill, text };
    }

    private queryElement<TElement extends HTMLElement>(root: ParentNode, selector: string): TElement {
        const element = root.querySelector<TElement>(selector);
        if (!element) {
            throw new Error(`Elemento HUD não encontrado: ${selector}`);
        }
        return element;
    }

    public getResource(kind: ResourceKind): HudResource {
        const resource = this.resources.get(kind);
        if (!resource) {
            throw new Error(`Recurso HUD não registrado: ${kind}`);
        }
        return resource;
    }

    public onProgressionUpdated(payload: PlayerProgressionUpdatePayload): void {
        const xpText: string = `${this.formatNumber(payload.experience)} / ${this.formatNumber(payload.experienceToNextLevel)}`;
        this.getResource('experience').setValue(payload.experience, payload.experienceToNextLevel, xpText);
        this.getResource('level').setLevel(payload.level, payload.level.toString());
        this.updateAttributePoints(payload.availableAttributePoints);
    }

    public onPlayerStatsInitialized(stats: PlayerStats): void {
        this.getResource('health').setValue(stats.derived.maxHealth, stats.derived.maxHealth);
        this.getResource('mana').setValue(stats.derived.maxMana, stats.derived.maxMana);
        this.getResource('level').setLevel(stats.progressionState.level, stats.progressionState.level.toString());
        this.updateAttributePoints(stats.progressionState.availableAttributePoints);
        const xpText: string = `${this.formatNumber(stats.progressionState.experience)} / ${this.formatNumber(stats.progressionState.experienceToNextLevel)}`;
        this.getResource('experience').setValue(
            stats.progressionState.experience,
            stats.progressionState.experienceToNextLevel,
            xpText,
        );
    }

    private updateAttributePoints(availablePoints: number): void {
        const isActive: boolean = availablePoints > 0;
        this.attributeContainer.classList.toggle('hud-attributes--active', isActive);
        this.attributeContainer.setAttribute('aria-live', isActive ? 'polite' : 'off');
        const textContent: string = isActive
            ? `${availablePoints} ponto${availablePoints > 1 ? 's' : ''} disponíveis`
            : 'Nenhum ponto disponível';
        if (this.attributeText.textContent !== textContent) {
            this.attributeText.textContent = textContent;
        }
        this.attributeButton.tabIndex = isActive ? 0 : -1;
        this.attributeButton.setAttribute('aria-hidden', isActive ? 'false' : 'true');
        this.attributeButton.disabled = !isActive;
        this.attributeButton.setAttribute('aria-disabled', isActive ? 'false' : 'true');
    }

    public destroy(): void {
        for (const dispose of this.disposers) {
            dispose();
        }
        this.resources.clear();
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
                bottom: clamp(12px, 2vw, 32px);
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: clamp(12px, 1.8vw, 22px);
                padding: clamp(8px, 1.4vw, 18px);
                width: min(92vw, 820px);
                pointer-events: none;
                color: #ffffff;
                font-family: 'Trebuchet MS', sans-serif;
                text-shadow: 1px 1px 2px #000000;
                box-sizing: border-box;
                line-height: 1.35;
                font-size: clamp(14px, 1.2vw + 10px, 18px);
            }
            .hud-wave {
                background: linear-gradient(135deg, rgba(14, 16, 25, 0.88), rgba(28, 34, 52, 0.72));
                border: 1px solid rgba(142, 179, 255, 0.35);
                border-radius: 999px;
                padding: clamp(6px, 1vw, 14px) clamp(18px, 2vw, 28px);
                font-size: clamp(14px, 1.1vw + 10px, 18px);
                pointer-events: auto;
                backdrop-filter: blur(6px);
                box-shadow: 0 8px 20px rgba(6, 9, 16, 0.45);
                align-self: center;
                letter-spacing: 0.08em;
                text-transform: uppercase;
            }
            .hud-bottom-panel {
                position: relative;
                display: flex;
                align-items: flex-end;
                justify-content: space-between;
                gap: clamp(16px, 3vw, 48px);
                width: 100%;
                padding: clamp(12px, 1.8vw, 24px) clamp(18px, 2.4vw, 36px);
                background: linear-gradient(180deg, rgba(12, 14, 20, 0.85) 0%, rgba(6, 8, 12, 0.95) 100%);
                border-radius: clamp(18px, 2.6vw, 36px);
                border: 1px solid rgba(190, 150, 82, 0.45);
                box-shadow: inset 0 0 24px rgba(245, 195, 125, 0.08), 0 18px 40px rgba(0, 0, 0, 0.55);
                pointer-events: auto;
                overflow: hidden;
            }
            .hud-bottom-panel::before,
            .hud-bottom-panel::after {
                content: '';
                position: absolute;
                top: 50%;
                width: clamp(42px, 6vw, 96px);
                height: 2px;
                background: linear-gradient(90deg, rgba(255, 216, 125, 0), rgba(255, 216, 125, 0.45), rgba(255, 216, 125, 0));
                transform: translateY(-50%);
            }
            .hud-bottom-panel::before {
                left: clamp(92px, 12vw, 140px);
            }
            .hud-bottom-panel::after {
                right: clamp(92px, 12vw, 140px);
            }
            .hud-orb {
                position: relative;
                width: clamp(88px, 9vw, 128px);
                aspect-ratio: 1 / 1;
                border-radius: 50%;
                border: 2px solid rgba(0, 0, 0, 0.7);
                background: radial-gradient(circle at 50% 35%, rgba(255, 255, 255, 0.35), transparent 55%), rgba(14, 16, 24, 0.8);
                overflow: hidden;
                display: flex;
                align-items: flex-end;
                justify-content: center;
                box-shadow: inset 0 0 22px rgba(0, 0, 0, 0.65), 0 12px 25px rgba(0, 0, 0, 0.5);
            }
            .hud-orb__fill {
                position: absolute;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 100%;
                transform-origin: center bottom;
                transform: scaleY(1);
                will-change: transform;
                transition: transform 120ms ease-out;
                background: linear-gradient(180deg, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0));
            }
            .hud-orb--health .hud-orb__fill {
                background-color: rgba(168, 14, 32, 0.85);
            }
            .hud-orb--mana .hud-orb__fill {
                background-color: rgba(38, 98, 204, 0.82);
            }
            .hud-orb__text {
                position: relative;
                z-index: 1;
                font-size: clamp(12px, 1vw + 10px, 16px);
                font-weight: 600;
                padding: 6px 10px;
                border-radius: 999px;
                background: rgba(6, 8, 12, 0.7);
                border: 1px solid rgba(255, 255, 255, 0.12);
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.45);
                pointer-events: none;
                margin-bottom: clamp(8px, 1.4vw, 16px);
            }
            .hud-center {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: clamp(10px, 1.4vw, 18px);
            }
            .hud-level {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 6px 12px;
                border-radius: 999px;
                background: linear-gradient(135deg, rgba(245, 195, 125, 0.2), rgba(245, 195, 125, 0));
                border: 1px solid rgba(245, 195, 125, 0.35);
                font-weight: 600;
                letter-spacing: 0.12em;
                text-transform: uppercase;
            }
            .hud-xp-bar {
                position: relative;
                width: 100%;
                height: clamp(18px, 1.8vw, 22px);
                border-radius: 999px;
                border: 1px solid rgba(77, 120, 255, 0.45);
                background: linear-gradient(180deg, rgba(12, 18, 40, 0.85), rgba(8, 12, 28, 0.95));
                overflow: hidden;
                box-shadow: inset 0 0 16px rgba(12, 24, 56, 0.6);
            }
            .hud-xp-bar__fill {
                position: absolute;
                top: 0;
                left: 0;
                height: 100%;
                width: 100%;
                transform-origin: left center;
                transform: scaleX(0);
                background: linear-gradient(90deg, rgba(80, 142, 255, 0.2), rgba(107, 162, 255, 0.9), rgba(182, 218, 255, 0.95));
                transition: transform 140ms ease-out;
                will-change: transform;
            }
            .hud-xp-bar__text {
                position: absolute;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: clamp(12px, 1vw + 10px, 16px);
                font-weight: 600;
                pointer-events: none;
            }
            .hud-attributes {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 6px 12px;
                border-radius: 999px;
                background: rgba(12, 18, 30, 0.8);
                border: 1px solid rgba(255, 212, 132, 0.25);
                box-shadow: 0 8px 18px rgba(0, 0, 0, 0.35);
                pointer-events: auto;
                transition: box-shadow 160ms ease-in-out, transform 160ms ease-in-out;
            }
            .hud-attributes--active {
                box-shadow: 0 0 22px rgba(255, 212, 132, 0.6), 0 12px 26px rgba(0, 0, 0, 0.4);
                animation: hud-attributes-pulse 1.4s ease-in-out infinite;
            }
            @keyframes hud-attributes-pulse {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-2px); }
            }
            .hud-attributes__button {
                width: clamp(26px, 3vw, 34px);
                height: clamp(26px, 3vw, 34px);
                border-radius: 50%;
                border: 1px solid rgba(255, 212, 132, 0.6);
                background: radial-gradient(circle, rgba(255, 230, 170, 0.95), rgba(255, 196, 104, 0.85));
                color: #3a2200;
                font-weight: 700;
                font-size: clamp(16px, 2vw, 22px);
                line-height: 1;
                cursor: pointer;
                pointer-events: auto;
                box-shadow: 0 6px 14px rgba(0, 0, 0, 0.35);
                transition: transform 120ms ease, box-shadow 120ms ease;
            }
            .hud-attributes__button:hover {
                transform: scale(1.05);
                box-shadow: 0 10px 20px rgba(0, 0, 0, 0.45);
            }
            .hud-attributes__button:active {
                transform: scale(0.96);
            }
            .hud-attributes__text {
                font-size: clamp(12px, 1vw + 10px, 16px);
                font-weight: 600;
                pointer-events: none;
            }
            @media (max-width: 768px) {
                .hud-root {
                    gap: clamp(10px, 3vw, 18px);
                    padding: 8px;
                }
                .hud-bottom-panel {
                    flex-direction: column;
                    align-items: center;
                    gap: clamp(12px, 4vw, 18px);
                }
                .hud-bottom-panel::before,
                .hud-bottom-panel::after {
                    display: none;
                }
                .hud-center {
                    width: 100%;
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
                <div class="hud-bottom-panel">
                    <div class="hud-orb hud-orb--health" data-resource="health">
                        <div class="hud-orb__fill" data-role="fill"></div>
                        <div class="hud-orb__text" data-role="text">0 / 0</div>
                    </div>
                    <div class="hud-center">
                        <div class="hud-level">
                            <span>NV</span>
                            <span data-hud="level">0</span>
                        </div>
                        <div class="hud-xp-bar" data-resource="experience">
                            <div class="hud-xp-bar__fill" data-role="fill"></div>
                            <div class="hud-xp-bar__text" data-role="text">0 / 0</div>
                        </div>
                        <div class="hud-attributes" data-hud="attributes">
                            <button
                                class="hud-attributes__button"
                                type="button"
                                title="Distribuir pontos de atributo (atalho: P)"
                                data-action="open-attributes"
                                data-hotkey="P"
                                aria-hidden="true"
                                tabindex="-1"
                            >
                                +
                            </button>
                            <span class="hud-attributes__text" data-hud="attributes-text">Nenhum ponto disponível</span>
                        </div>
                    </div>
                    <div class="hud-orb hud-orb--mana" data-resource="mana">
                        <div class="hud-orb__fill" data-role="fill"></div>
                        <div class="hud-orb__text" data-role="text">0 / 0</div>
                    </div>
                </div>
            </div>
        `;
        dom.createFromHTML(html);

        const containerElement: HTMLElement = dom.node as HTMLElement;
        containerElement.style.display = 'block';
        containerElement.style.width = '100%';
        containerElement.style.height = '100%';
        containerElement.style.left = '0';
        containerElement.style.top = '0';
        containerElement.style.pointerEvents = 'none';

        const rootElement = dom.node as HTMLElement;
        const waveElement = this.queryHudElement(rootElement, '[data-hud="wave"]');
        this.hudElements = {
            wave: waveElement,
        };

        try {
            this.hudBehavior = new BottomBarHudBehavior(rootElement, this, (value: number) => this.formatNumber(value));
        } catch (error) {
            console.error('Falha ao inicializar HUD avançado:', error);
            this.hudBehavior = this.nullHudBehavior;
        }

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
