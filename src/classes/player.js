// player.js
// Classe Player para o jogador do jogo
// Dependências: Phaser

import { fireAttack, playerHitEnemy } from '../utils/attackUtils.js';
import { handleControls } from '../utils/controlUtils.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, selectedClass) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.selectedClass = selectedClass;
        this.lastAttackDirection = new Phaser.Math.Vector2(0, -1);

        // Atributos base do jogador, utilizados para recalcular os demais
        // status sempre que houver um level up.
        this.baseStats = {
            vida: selectedClass.vida,
            dano: selectedClass.dano,
            defesa: selectedClass.defesa || 0
        };

        this.setData({
            level: 1,
            xp: 0,
            xpToNextLevel: 100,
            isInvulnerable: false,
            lastAttack: 0,
            lastSpecialAttack: -Infinity
        });

        // Calcula HP, dano e outros atributos derivados dos primários
        this.recomputeStats();

        this.setCollideWorldBounds(true);
    }

    update(time, delta, cursors, moveJoystick, attackJoystick) {
        if (!this.active) return;

        handleControls(this.scene);

        // A lógica de atualização da arma e outras atualizações que estavam no `update` de `DungeonScene`
        // podem ser movidas para cá ou gerenciadas de forma diferente.
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

        // Incrementa os atributos primários de acordo com o crescimento da classe
        const growth = this.selectedClass.growth || {};
        for (const [key, value] of Object.entries(growth)) {
            this.baseStats[key] = (this.baseStats[key] || 0) + value;
        }

        // Recalcula HP, dano e outros atributos derivados
        this.recomputeStats();
        this.setData('xpToNextLevel', Math.floor(this.getData('xpToNextLevel') * 1.5));

        this.scene.showFloatingText('Level Up!', this.x, this.y - 50, false, '#ffd700');
    }

    // Atualiza os status derivados (HP, dano, defesa...) com base nos atributos primários
    recomputeStats() {
        const { vida = 0, dano = 0, defesa = 0 } = this.baseStats;
        this.setData('maxHp', vida);
        this.setData('hp', vida);
        this.setData('damage', dano);
        this.setData('defense', defesa);
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
