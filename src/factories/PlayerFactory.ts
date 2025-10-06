import { Scene, Physics } from 'phaser';
import { HealthComponent } from '../components/HealthComponent';
import { ConfigService } from '../config/ConfigService';
import { DamageTextManager } from '../components/DamageTextManager';
import type { PlayerStats } from '../config/types';
import { AttributeCalculator } from '../systems/attributes/AttributeCalculator';
import { PlayerProgressionSystem } from '../systems/PlayerProgressionSystem';

export class PlayerFactory {
    public static create(scene: Scene, x: number, y: number, damageTextManager: DamageTextManager): Physics.Arcade.Sprite {
        const player = scene.physics.add.sprite(x, y, 'player', 'player-idle-1');
        player.setCollideWorldBounds(true);

        // Anexa o HealthComponent ao Data Manager do sprite.
        const playerConfig = ConfigService.getInstance().getCharacterConfig();
        const playerStats: PlayerStats = AttributeCalculator.getInstance().computePlayerStats(playerConfig);

        player.setData('stats', playerStats);
        player.setData('health', new HealthComponent(scene, player, playerStats.derived.maxHealth, damageTextManager));
        scene.game.registry.set('player-stats', playerStats);
        scene.game.events.emit('player-stats-inicializados', playerStats);
        PlayerProgressionSystem.getInstance().initialize(scene, player, playerStats, playerConfig);

        // Cria as animações do jogador
        scene.anims.create({
            key: 'player-idle',
            frames: scene.anims.generateFrameNames('player', { prefix: 'player-idle-', start: 1, end: 2 }),
            frameRate: 3,
            repeat: -1
        });

        scene.anims.create({
            key: 'player-walk',
            frames: scene.anims.generateFrameNames('player', { prefix: 'player-walk-', start: 1, end: 2 }),
            frameRate: 8,
            repeat: -1
        });

        return player;
    }
}