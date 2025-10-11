import Phaser, { Physics } from 'phaser';
import type { Types } from 'phaser';
import { AnimationSystem } from './AnimationSystem';
import type { PlayerStats } from '../config/types';
import { getRequiredPlayerStats } from './utils/getRequiredPlayerStats';
import type { PlayerProgressionUpdatePayload } from './PlayerProgressionSystem';

export class MovementSystem {
    private cursors: Types.Input.Keyboard.CursorKeys;
    private player: Physics.Arcade.Sprite;
    private animationSystem: AnimationSystem;
    private currentSpeed: number;
    private readonly baseSpeed: number;
    private readonly progressionHandler: (payload: PlayerProgressionUpdatePayload) => void;
    private sceneEvents: Phaser.Events.EventEmitter | null = null;

    constructor(cursors: Types.Input.Keyboard.CursorKeys, player: Physics.Arcade.Sprite) {
        this.cursors = cursors;
        this.player = player;
        this.animationSystem = new AnimationSystem(this.player);
        const initialStats: PlayerStats = getRequiredPlayerStats(player);
        this.baseSpeed = initialStats.movementSpeed;
        this.currentSpeed = initialStats.movementSpeed;
        this.animationSystem.setBaseMovementSpeed(this.baseSpeed);
        this.animationSystem.onMovementSpeedChanged(this.currentSpeed);
        this.progressionHandler = this.handleProgressionUpdated.bind(this);
        this.registerProgressionListener();
        this.registerSceneLifecycleCleanup();
    }

    public update(): void {
        const input: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);

        if (this.cursors.left.isDown) {
            input.x -= 1;
        } else if (this.cursors.right.isDown) {
            input.x += 1;
        }

        if (this.cursors.up.isDown) {
            input.y -= 1;
        } else if (this.cursors.down.isDown) {
            input.y += 1;
        }

        if (input.lengthSq() > 0) {
            input.normalize().scale(this.currentSpeed);
        }

        this.player.setVelocity(input.x, input.y);
        this.animationSystem.update();
    }

    private handleProgressionUpdated(_: PlayerProgressionUpdatePayload): void {
        this.currentSpeed = getRequiredPlayerStats(this.player).movementSpeed;
        this.animationSystem.onMovementSpeedChanged(this.currentSpeed);
    }

    private registerProgressionListener(): void {
        const scene = this.player.scene;
        if (!scene) {
            return;
        }

        this.sceneEvents = scene.game.events;
        this.sceneEvents.on('player-progression-updated', this.progressionHandler);
    }

    private registerSceneLifecycleCleanup(): void {
        const scene = this.player.scene;
        if (!scene) {
            return;
        }

        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
        scene.events.once(Phaser.Scenes.Events.DESTROY, this.destroy, this);
    }

    public destroy(): void {
        if (this.sceneEvents) {
            this.sceneEvents.off('player-progression-updated', this.progressionHandler);
            this.sceneEvents = null;
        }
    }
}