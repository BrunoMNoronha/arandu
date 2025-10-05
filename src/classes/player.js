// player.js
// Classe Player para o jogador do jogo
// Dependências: Phaser

import { calcPhysicalAttack, calcMaxHp, calcMoveSpeed, calcAttackCooldown } from '../utils/attributeUtils.js';

/**
 * @typedef {Object} PlayerClassConfig
 * @property {string} id
 * @property {number} velocidade
 * @property {number} attackCooldown
 * @property {number} [attackRange]
 * @property {number} [damageReduction]
 * @property {number} cor
 * @property {Record<string, number>} baseAttributes
 * @property {{ name: string, cooldown: number, radius: number }} ability
 */

/**
 * @typedef {Object} PlayerUpdateInput
 * @property {Phaser.Math.Vector2} [movementVelocity]
 * @property {Phaser.Math.Vector2} [attackDirection]
 */

/**
 * @extends Phaser.Physics.Arcade.Sprite
 */
export default class Player extends Phaser.Physics.Arcade.Sprite {
    /**
     * @param {Phaser.Scene} scene
     * @param {number} x
     * @param {number} y
     * @param {string} texture
     * @param {PlayerClassConfig} selectedClass
     */
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
            attributePoints: 0,
            attributes: { ...this.selectedClass.baseAttributes },
            maxHp: 0,
            hp: 0,
            damage: 0,
            speed: selectedClass.velocidade,
            attackCooldown: selectedClass.attackCooldown,
            isInvulnerable: false,
            lastAttack: 0,
            lastSpecialAttack: -Infinity
        });

        this.recomputeStats();
        this.setData('hp', this.getData('maxHp'));
        this.setCollideWorldBounds(true);
    }

    /**
     * @param {number} time
     * @param {number} delta
     * @param {PlayerUpdateInput} [input]
     * @returns {void}
     */
    update(time, delta, input = {}) {
        if (!this.active) return;

        const { attackDirection, movementVelocity } = input;
        if (attackDirection && attackDirection.length() > 0) {
            this.lastAttackDirection.copy(attackDirection).normalize();
        } else if (movementVelocity && movementVelocity.length() > 0) {
            this.lastAttackDirection.copy(movementVelocity).normalize();
        }

        // A lógica de atualização da arma e outras atualizações que estavam no `update` de `DungeonScene`
        // podem ser movidas para cá ou gerenciadas de forma diferente.
    }

    recomputeStats() {
        const attrs = this.getData('attributes');
        const newMaxHp = calcMaxHp(attrs);
        const newDamage = calcPhysicalAttack(attrs);
        const newSpeed = calcMoveSpeed(attrs, this.selectedClass.velocidade);
        const newCooldown = calcAttackCooldown(attrs, this.selectedClass.attackCooldown);

        this.setData('maxHp', newMaxHp);
        this.setData('damage', newDamage);
        this.setData('speed', newSpeed);
        this.setData('attackCooldown', newCooldown);

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
                duration: 50,
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
        let xp = this.getData('xp') + amount;
        let next = this.getData('xpToNextLevel');
        while (xp >= next) {
            xp -= next;
            this.levelUp();
            next = this.getData('xpToNextLevel');
        }
        this.setData('xp', xp);
        this.scene.showFloatingText(`+${amount} XP`, this.x, this.y - 40, false, '#00ff7f');
        this.scene.updatePlayerHud();
    }

    levelUp() {
        const newXpToNext = Math.floor(this.getData('xpToNextLevel') * 1.5);

        this.setData('level', this.getData('level') + 1);
        this.setData('attributePoints', this.getData('attributePoints') + 5);
        this.setData('xpToNextLevel', newXpToNext);
        this.recomputeStats();
        this.setData('hp', this.getData('maxHp'));

        this.scene.showFloatingText('LEVEL UP!', this.x, this.y, false, '#ffff00');
        this.scene.updatePlayerHud();
    }

    allocateAttribute(attr) {
        let points = this.getData('attributePoints');
        if (points <= 0) return false;
        const attrs = this.getData('attributes');
        attrs[attr] = (attrs[attr] || 0) + 1;
        this.setData('attributes', attrs);
        this.setData('attributePoints', points - 1);
        this.recomputeStats();
        this.scene.updatePlayerHud();
        return true;
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
