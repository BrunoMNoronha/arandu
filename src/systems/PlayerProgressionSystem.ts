import Phaser, { Scene, Physics } from 'phaser';
import type {
    DerivedAttributes,
    PlayerConfig,
    PlayerProgressionState,
    PlayerStats,
    PrimaryAttributes,
} from '../config/types';
import { AttributeCalculator } from './attributes/AttributeCalculator';
import { HealthComponent } from '../components/HealthComponent';

export interface EnemyDefeatedEventPayload {
    readonly xpReward: number;
}

export interface AttributeAllocationRequestPayload {
    readonly attribute: keyof PrimaryAttributes;
}

export interface PlayerProgressionUpdatePayload {
    readonly level: number;
    readonly experience: number;
    readonly experienceToNextLevel: number;
    readonly availableAttributePoints: number;
    readonly primary: PrimaryAttributes;
    readonly derived: DerivedAttributes;
}

export class PlayerProgressionSystem {
    private static instance: PlayerProgressionSystem | null = null;

    public static getInstance(): PlayerProgressionSystem {
        if (!PlayerProgressionSystem.instance) {
            PlayerProgressionSystem.instance = new PlayerProgressionSystem();
        }

        return PlayerProgressionSystem.instance;
    }

    private scene: Scene | null = null;
    private player: Physics.Arcade.Sprite | null = null;
    private playerConfig: PlayerConfig | null = null;
    private currentStats: PlayerStats | null = null;
    private baseAttributes: PrimaryAttributes | null = null;
    private allocatedAttributes: PrimaryAttributes = PlayerProgressionSystem.createEmptyAttributes();
    private level: number = 1;
    private experience: number = 0;
    private experienceToNextLevel: number = 0;
    private availableAttributePoints: number = 0;
    private currentMana: number = 0;

    private constructor() {}

    public initialize(
        scene: Scene,
        player: Physics.Arcade.Sprite,
        initialStats: PlayerStats,
        playerConfig: PlayerConfig
    ): void {
        this.cleanup();

        this.scene = scene;
        this.player = player;
        this.playerConfig = playerConfig;
        this.currentStats = initialStats;
        this.baseAttributes = { ...initialStats.primary };
        this.allocatedAttributes = PlayerProgressionSystem.createEmptyAttributes();
        this.level = initialStats.progressionState.level;
        this.experience = initialStats.progressionState.experience;
        this.experienceToNextLevel = initialStats.progressionState.experienceToNextLevel;
        this.availableAttributePoints = initialStats.progressionState.availableAttributePoints;
        this.currentMana = initialStats.derived.maxMana;

        this.registerListeners();
        this.syncResourceRegistries(initialStats.derived.maxMana);
        this.emitProgressionUpdate();
    }

    public addExperience(amount: number): void {
        if (!this.scene || amount <= 0) {
            return;
        }

        this.experience += amount;
        const growthRate: number = this.playerConfig?.attributes.progression.experience.growthRate ?? 1.25;
        let leveledUp: boolean = false;

        if (this.experienceToNextLevel <= 0) {
            this.experienceToNextLevel = this.playerConfig?.attributes.progression.experience.baseExperienceToLevel ?? 100;
        }

        while (this.experience >= this.experienceToNextLevel) {
            this.experience -= this.experienceToNextLevel;
            this.level += 1;
            this.experienceToNextLevel = Math.max(1, Math.round(this.experienceToNextLevel * growthRate));
            this.availableAttributePoints += this.calculatePointsPerLevel();
            leveledUp = true;
        }

        if (leveledUp) {
            this.recalculateStats(true);
        } else {
            this.emitProgressionUpdate();
        }
    }

    public allocateAttribute(attribute: keyof PrimaryAttributes): void {
        if (!this.scene || this.availableAttributePoints <= 0 || !this.baseAttributes) {
            return;
        }

        this.allocatedAttributes = {
            ...this.allocatedAttributes,
            [attribute]: this.allocatedAttributes[attribute] + 1,
        };
        this.availableAttributePoints -= 1;
        this.recalculateStats(false);
    }

    private recalculateStats(refillResources: boolean): void {
        if (!this.scene || !this.player || !this.playerConfig || !this.baseAttributes) {
            return;
        }

        const previousStats: PlayerStats | null = this.currentStats;
        const updatedPrimary: PrimaryAttributes = this.composePrimaryAttributes();
        const updatedProgressionState: PlayerProgressionState = {
            level: this.level,
            experience: this.experience,
            experienceToNextLevel: this.experienceToNextLevel,
            availableAttributePoints: this.availableAttributePoints,
        };
        const updatedStats: PlayerStats = AttributeCalculator.getInstance().computePlayerStats(
            this.playerConfig,
            updatedPrimary,
            updatedProgressionState
        );
        this.currentStats = updatedStats;
        this.player.setData('stats', updatedStats);
        this.scene.game.registry.set('player-stats', updatedStats);

        const healthComponent = this.player.getData('health') as HealthComponent | undefined;
        if (healthComponent) {
            healthComponent.updateMaxHealth(updatedStats.derived.maxHealth, refillResources);
        }

        const previousMaxMana: number = previousStats?.derived.maxMana ?? updatedStats.derived.maxMana;
        const manaRatio: number = previousMaxMana > 0 ? this.currentMana / previousMaxMana : 1;
        this.currentMana = refillResources
            ? updatedStats.derived.maxMana
            : Math.max(0, Math.round(updatedStats.derived.maxMana * manaRatio));
        this.syncResourceRegistries(updatedStats.derived.maxMana);
        this.emitProgressionUpdate();
    }

    private emitProgressionUpdate(): void {
        if (!this.scene || !this.currentStats) {
            return;
        }

        const payload: PlayerProgressionUpdatePayload = {
            level: this.level,
            experience: this.experience,
            experienceToNextLevel: this.experienceToNextLevel,
            availableAttributePoints: this.availableAttributePoints,
            primary: this.currentStats.primary,
            derived: this.currentStats.derived,
        };

        this.scene.game.registry.set('player-level', payload.level);
        this.scene.game.registry.set('player-experience', payload.experience);
        this.scene.game.registry.set('player-experience-to-next', payload.experienceToNextLevel);
        this.scene.game.registry.set('player-available-attribute-points', payload.availableAttributePoints);

        this.scene.game.events.emit('player-progression-updated', payload);
    }

    private syncResourceRegistries(maxMana: number): void {
        if (!this.scene || !this.currentStats) {
            return;
        }

        this.scene.game.registry.set('player-mana', this.currentMana);
        this.scene.game.registry.set('player-max-mana', maxMana);
        this.scene.game.events.emit('player-mana-changed', { current: this.currentMana, max: maxMana });
    }

    private calculatePointsPerLevel(): number {
        const progression = this.playerConfig?.attributes.progression.pointsPerLevel;
        if (!progression) {
            return 0;
        }

        return Math.round((progression.min + progression.max) / 2);
    }

    private composePrimaryAttributes(): PrimaryAttributes {
        if (!this.baseAttributes) {
            return PlayerProgressionSystem.createEmptyAttributes();
        }

        return {
            strength: this.baseAttributes.strength + this.allocatedAttributes.strength,
            agility: this.baseAttributes.agility + this.allocatedAttributes.agility,
            vitality: this.baseAttributes.vitality + this.allocatedAttributes.vitality,
            intelligence: this.baseAttributes.intelligence + this.allocatedAttributes.intelligence,
            dexterity: this.baseAttributes.dexterity + this.allocatedAttributes.dexterity,
        };
    }

    private registerListeners(): void {
        if (!this.scene) {
            return;
        }

        this.scene.game.events.on('enemy-defeated', this.handleEnemyDefeated, this);
        this.scene.game.events.on('attribute-allocation-requested', this.handleAttributeAllocationRequested, this);
        this.scene.events.on(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    }

    private cleanup(): void {
        if (this.scene) {
            this.scene.game.events.off('enemy-defeated', this.handleEnemyDefeated, this);
            this.scene.game.events.off('attribute-allocation-requested', this.handleAttributeAllocationRequested, this);
            this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
        }

        this.scene = null;
        this.player = null;
        this.playerConfig = null;
        this.currentStats = null;
        this.baseAttributes = null;
        this.allocatedAttributes = PlayerProgressionSystem.createEmptyAttributes();
        this.level = 1;
        this.experience = 0;
        this.experienceToNextLevel = 0;
        this.availableAttributePoints = 0;
        this.currentMana = 0;
    }

    private handleEnemyDefeated(payload: EnemyDefeatedEventPayload): void {
        this.addExperience(payload.xpReward);
    }

    private handleAttributeAllocationRequested(payload: AttributeAllocationRequestPayload): void {
        this.allocateAttribute(payload.attribute);
    }

    private static createEmptyAttributes(): PrimaryAttributes {
        return {
            strength: 0,
            agility: 0,
            vitality: 0,
            intelligence: 0,
            dexterity: 0,
        };
    }
}
