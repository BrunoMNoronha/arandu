import { Scene, Physics } from 'phaser';
import { HealthComponent } from '../components/HealthComponent';
import { ConfigService } from '../config/ConfigService';
import { DamageTextManager } from '../components/DamageTextManager';

export class PlayerFactory {
    public static create(scene: Scene, x: number, y: number, damageTextManager: DamageTextManager): Physics.Arcade.Sprite {
        const player = scene.physics.add.sprite(x, y, 'player', 'player-idle-1');
        player.setCollideWorldBounds(true);

        // Anexa o HealthComponent ao Data Manager do sprite.
        const playerConfig = ConfigService.getInstance().getCharacterConfig();
        player.setData('health', new HealthComponent(scene, player, playerConfig.maxHealth, damageTextManager));

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