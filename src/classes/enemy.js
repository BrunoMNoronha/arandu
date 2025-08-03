// enemy.js
// Classe Enemy para inimigos do jogo
// Dependências: Phaser

import { gainXP, defeatTarget } from '../utils/attackUtils.js';

// --- Classe Enemy ---
// Representa inimigos do jogo, com barra de vida e IA
// Dependências: Phaser

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        this.healthBar = scene.healthBars.get();
        if (this.healthBar) {
            this.healthBar.setActive(true).setVisible(true);
        }
        this.stunEffect = scene.add.text(0, 0, '★', { fontSize: '24px', color: '#ffff00', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setVisible(false).setDepth(1);
    }
    spawn(data, waveNum) {
        this.stats = { ...data };
        this.applyWaveScaling(waveNum);
        this.setData({ hp: this.stats.vida, maxHp: this.stats.vida, lastAttackTime: 0, isDying: false, isStunned: false });
        this.setActive(true);
        this.setVisible(true);
        this.body.enable = true;
        this.setImmovable(false).setCollideWorldBounds(true);
        this.setAlpha(1).setScale(1);
        if (this.healthBar) {
            this.healthBar.setActive(true).setVisible(true);
        }
        this.updateHealthBar();
    }
    applyWaveScaling(waveNum) {
        if (waveNum > 5) {
            const scaleFactor = 1 + (waveNum - 5) * 0.08;
            this.stats.vida = Math.ceil(this.stats.vida * scaleFactor);
            this.stats.dano = Math.ceil(this.stats.dano * scaleFactor);
            this.stats.velocidade = this.stats.velocidade * (1 + (waveNum - 5) * 0.05);
        }
    }
    update(time, delta) {
        if (!this.active || !this.scene.player.active) {
            this.body.setVelocity(0,0);
            return;
        }
        this.runAI(time);
        this.updateHealthBar();
        this.stunEffect.setPosition(this.x, this.y - this.height).setVisible(this.getData('isStunned'));
    }
    runAI(time) {
        if (this.getData('isStunned')) {
            this.body.setVelocity(0,0);
            return;
        }
        const { ai, velocidade, attackRange, attackDelay } = this.stats;
        const player = this.scene.player;
        const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        switch (ai) {
            case 'melee':
                this.scene.physics.moveToObject(this, player, velocidade);
                break;
            case 'ranged':
                if (distance > attackRange) {
                    this.scene.physics.moveToObject(this, player, velocidade);
                } else {
                    this.body.setVelocity(0, 0);
                    const lastAttackTime = this.getData('lastAttackTime') || 0;
                    if (time > lastAttackTime + attackDelay) {
                        this.scene.enemyFireAttack(this);
                        this.setData('lastAttackTime', time);
                    }
                }
                break;
        }
    }
    takeDamage(amount, isCrit = false) {
        if (!this.active || this.getData('isDying')) return;
        const newHp = this.getData('hp') - amount;
        this.setData('hp', newHp);
        this.scene.showFloatingText(Math.round(amount), this.x, this.y, isCrit);
        this.updateHealthBar();
        if (newHp <= 0) {
            this.setData('isDying', true);
            defeatTarget(this.scene, this);
        }
    }
    updateHealthBar() {
        if (!this.healthBar || !this.active) return;
        this.healthBar.setPosition(this.x - 16, this.y - 30);
        const pct = Math.max(0, this.getData('hp') / this.getData('maxHp'));
        this.healthBar.clear().fillStyle(0x000000, 0.7).fillRoundedRect(0, 0, 32, 8, 3).fillStyle(0xff0000).fillRoundedRect(1, 1, 30 * pct, 6, 2);
    }
    die() {
        gainXP(this.scene, this.stats.xp);
        if (this.healthBar) {
            this.healthBar.setActive(false).setVisible(false);
        }
        this.stunEffect.destroy();
        this.scene.tweens.add({ targets: this, alpha: 0, scale: 0, duration: 300, ease: 'Power2', onComplete: () => { this.setActive(false).setVisible(false); this.body.enable = false; } });
    }
}
