// player.js
// Classe Player para o jogador do jogo
// Dependências: Phaser

import { fireAttack, playerHitEnemy } from '../utils/attackUtils.js';
import { handleControls } from '../utils/controlUtils.js';
import { calcPhysicalAttack, calcMaxHp } from '../utils/attributeUtils.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, selectedClass) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.selectedClass = selectedClass;
        this.lastAttackDirection = new Phaser.Math.Vector2(0, -1);

        this.setData({
            level: 1,
            xp: 0,
            xpToNextLevel: 100,
            attributes: { ...this.selectedClass.baseAttributes },
            maxHp: 0,
            hp: 0,
            damage: 0,
            isInvulnerable: false,
            lastAttack: 0,
            lastSpecialAttack: -Infinity
        });

        this.recomputeStats();
        this.setData('hp', this.getData('maxHp'));

        this.setCollideWorldBounds(true);
    }

    update(time, delta, cursors, moveJoystick, attackJoystick) {
        if (!this.active) return;

        handleControls(this.scene);

        // A lógica de atualização da arma e outras atualizações que estavam no `update` de `DungeonScene`
        // podem ser movidas para cá ou gerenciadas de forma diferente.
    }

    recomputeStats() {
        const attrs = this.getData('attributes');
        const newMaxHp = calcMaxHp(attrs);
        const newDamage = calcPhysicalAttack(attrs);

        this.setData('maxHp', newMaxHp);
        this.setData('damage', newDamage);

        if (this.getData('hp') > newMaxHp) {
            this.setData('hp', newMaxHp);
        }
    }

    takeDamage(amount) {
        if (this.getData('isInvulnerable')) return;

        const newHp = this.getData('hp') - amount;
        this.setData('hp', newHp);
        this.scene.updatePlayerHud();

        if (newHp <= 0) {
            this.die();
        } else {
            // Efeito de invulnerabilidade temporária
            this.setData('isInvulnerable', true);
            this.scene.tweens.add({
                targets: this,
                alpha: 0.5,
                duration: 100,
                ease: 'Linear',
                yoyo: true,
                repeat: 5,
                onComplete: () => {
                    this.setAlpha(1);
                    this.setData('isInvulnerable', false);
                }
            });
        }
    }

    gainXP(amount) {
        let currentXP = this.getData('xp') + amount;
        let xpToNextLevel = this.getData('xpToNextLevel');

        while (currentXP >= xpToNextLevel) {
            currentXP -= xpToNextLevel;
            this.levelUp();
            xpToNextLevel = this.getData('xpToNextLevel');
        }

        this.setData('xp', currentXP);
        this.scene.updatePlayerHud();
    }

    levelUp() {
        const newLevel = this.getData('level') + 1;
        this.setData('level', newLevel);

        // Incrementa atributos com base na classe
        const growth = this.selectedClass.growth;
        const attrs = this.getData('attributes');
        for (const key of Object.keys(attrs)) {
            attrs[key] += growth[key] || 0;
        }
        this.setData('attributes', attrs);

        this.recomputeStats();
        this.setData('hp', this.getData('maxHp')); // Cura total ao subir de nível
        this.setData('xpToNextLevel', Math.floor(this.getData('xpToNextLevel') * 1.5));

        this.scene.showFloatingText('Level Up!', this.x, this.y - 50, false, '#ffd700');
    }



    die() {
        // Lógica de morte do jogador
        this.setActive(false);
        this.setVisible(false);
        this.scene.cameras.main.fadeOut(1000, 0, 0, 0);
        this.scene.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.scene.start('CharacterSelectScene');
        });
    }
}
