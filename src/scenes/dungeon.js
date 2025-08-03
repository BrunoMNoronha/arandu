// dungeon.js
// Cena principal do jogo (Dungeon)
// Dependências: Phaser, GameData, WaveConfig, Enemy, Joystick

import { GameData, WaveConfig } from '../data/data.js';
import Enemy from '../classes/enemy.js';
import Player from '../classes/player.js';
import Joystick from '../classes/joystick.js';
import {
    createHUD,
    updatePlayerHud as hudUpdate,
    updateWaveProgressText as waveTextUpdate,
    showFloatingText as floatingTextShow,
    repositionHUD,
    updateSpecialAbilityUI
} from '../utils/hudUtils.js';
import { handleControls } from '../utils/controlUtils.js';
import { fireAttack, enemyFireAttack, projectileHitEnemy, projectileHitPlayer, playerHitEnemy } from '../utils/attackUtils.js';
import { generatePlayerTexture, generateTatuZumbiTexture, generateAranhaDeDardoTexture, generateBossJiboiaTexture, generateWeaponTexture, generateProjectileTextures, generateIcons } from '../utils/assetUtils.js';
import { useArrowRain, useShockwave } from '../utils/abilityUtils.js';

export default class DungeonScene extends Phaser.Scene {
    constructor(){ super('DungeonScene'); }

    init(data){
        this.selectedClass = data.selectedClass;
        this.isTargetingAbility = false;
        this.lastAttackDirection = new Phaser.Math.Vector2(0, -1);
    }

    preload(){
        // Player
        generatePlayerTexture(this, this.selectedClass.cor);

        // Tatu Zumbi
        generateTatuZumbiTexture(this, GameData.Enemies.TATU_ZUMBI.cor);

        // Aranha de Dardo
        generateAranhaDeDardoTexture(this, GameData.Enemies.ARANHA_DE_DARDO.cor);

        // Boss Jiboia
        generateBossJiboiaTexture(this, GameData.Enemies.BOSS_JIBOIA.cor);

        // Armas
        generateWeaponTexture(this, this.selectedClass.id);

        // Projetéis
        generateProjectileTextures(this);

        // Ícones
        generateIcons(this);
    }

    create() {
        this.input.addPointer(1);
        // Desktop: auto ataque com espaço
        if (!this.sys.game.device.input.touch) {
            this.spaceAttackInterval = null;
            this.input.keyboard.on('keydown-SPACE', () => {
                if (!this.spaceAttackInterval) {
                    let dir = this.lastAttackDirection || new Phaser.Math.Vector2(0, -1);
                    fireAttack(this, dir);
                    this.spaceAttackInterval = this.time.addEvent({
                        delay: this.selectedClass.attackCooldown,
                        loop: true,
                        callback: () => {
                            let dir = this.lastAttackDirection || new Phaser.Math.Vector2(0, -1);
                            fireAttack(this, dir);
                        }
                    });
                }
            });
            this.input.keyboard.on('keyup-SPACE', () => {
                if (this.spaceAttackInterval) {
                    this.spaceAttackInterval.remove();
                    this.spaceAttackInterval = null;
                }
            });
        }
        // Mobile: auto ataque ao manter pressionado o botão de ataque do joystick
        this.joystickAttackInterval = null;
        this.time.now = 0;
        this.cameras.main.fadeIn(500, 0, 0, 0);
        this.background = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x1a2b1a).setOrigin(0).setDepth(-1);

        this.player = new Player(this, this.scale.width / 2, this.scale.height / 2, 'player-texture', this.selectedClass);

        // --- ARMA VISUAL ---
        const armaKey = this.selectedClass.id === 'CACADOR' ? 'zarabatana' : 'machado';
        if (this.textures.exists(armaKey)) {
            this.weaponSprite = this.add.sprite(this.player.x, this.player.y, armaKey).setOrigin(0.1, 0.5).setDepth(2);
        } else {
            console.warn('[DungeonScene] Textura da arma não existe:', armaKey);
        }

        this.playerAttacks = this.createProjectileGroup('player-projectile-texture', 30);
        this.enemyAttacks = this.createProjectileGroup('enemy-projectile-texture', 40);

        this.healthBars = this.add.group({ classType: Phaser.GameObjects.Graphics });
        this.floatingTexts = this.add.group({ classType: Phaser.GameObjects.Text, defaultKey: 'text', maxSize: 50 });
        this.enemies = this.physics.add.group({ classType: Enemy, runChildUpdate: true, maxSize: 60 });

        this.physics.add.collider(this.player, this.enemies, (player, enemy) => playerHitEnemy(this, player, enemy), null, this);
        this.physics.add.collider(this.enemies, this.enemies);

        this.physics.add.overlap(this.playerAttacks, this.enemies, (proj, enemy) => projectileHitEnemy(this, proj, enemy), null, this);
        this.physics.add.overlap(this.player, this.enemyAttacks, (player, proj) => projectileHitPlayer(this, player, proj), null, this);

        this.fireAttack = (dir) => fireAttack(this, dir);
        this.enemyFireAttack = (enemy) => enemyFireAttack(this, enemy);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.moveJoystick = new Joystick(this);
        this.attackJoystick = new Joystick(this, true);

        // Marcador visual para a área da habilidade
        const abilityRadius = this.selectedClass.ability.radius;
        this.abilityTargetMarker = this.add.graphics({
            fillStyle: { color: this.selectedClass.cor, alpha: 0.4 },
            lineStyle: { width: 2, color: 0xffffff, alpha: 0.7 }
        }).setDepth(5).setVisible(false);
        this.abilityTargetMarker.fillCircle(0, 0, abilityRadius);
        this.abilityTargetMarker.strokeCircle(0, 0, abilityRadius);

        // Evento para confirmar o uso da habilidade
        this.input.on('pointerup', (pointer) => {
            if (this.isTargetingAbility) {
                this.isTargetingAbility = false;
                this.abilityTargetMarker.setVisible(false);
                const targetPos = { x: pointer.worldX, y: pointer.worldY };
                this.executeSpecialAbility(targetPos);
            }
        }, this);

        createHUD(this);
        this.setupWaveSystem();
        this.scale.on('resize', this.onResize, this);
        this.isLandscape = this.scale.width > this.scale.height;
    }

    update(time, delta) {
        this.time.now = time;
        if (this.isTargetingAbility) {
            const pointer = this.input.activePointer;
            this.abilityTargetMarker.setPosition(pointer.worldX, pointer.worldY);
        }

        this.player.update(time, delta, this.cursors, this.moveJoystick, this.attackJoystick);

        if (this.weaponSprite && this.player.active) {
            let dir = this.player.lastAttackDirection;
            if (this.attackJoystick && this.attackJoystick.vector.length() > 0) {
                dir = this.attackJoystick.vector.clone().normalize();
                this.player.lastAttackDirection = dir;
            } else if (this.player.body.velocity.length() > 0) {
                dir = this.player.body.velocity.clone().normalize();
                this.player.lastAttackDirection = dir;
            }
            const offset = 28;
            this.weaponSprite.x = this.player.x + dir.x * offset;
            this.weaponSprite.y = this.player.y + dir.y * offset;
            this.weaponSprite.rotation = dir.angle();
            this.weaponSprite.setVisible(true);
        }
        if (!this.player.active && this.weaponSprite) {
            this.weaponSprite.setVisible(false);
            return;
        }
        handleControls(this);
        updateSpecialAbilityUI(this);
        this.checkWaveCompletion();
    }

    onResize(gameSize) {
        this.isLandscape = gameSize.width > gameSize.height;
        this.background.setSize(gameSize.width, gameSize.height);
        this.cameras.main.setScroll(0, 0);
        this.physics.world.setBounds(0, 0, gameSize.width, gameSize.height);
        this.player.setCollideWorldBounds(true);
        repositionHUD(this, gameSize.width, gameSize.height);
    }

    updatePlayerHud() {
        hudUpdate(this, this.player.data.getAll());
    }

    updateWaveProgressText() {
        waveTextUpdate(this);
    }

    showFloatingText(txt, x, y, isCrit = false, color = '#ffdddd') {
        floatingTextShow(this, txt, x, y, isCrit, color);
    }

    setupWaveSystem() {
        this.currentWave = 0;
        this.waveState = 'BETWEEN_WAVES';
        // Texto de onda e contagem regressiva
        const textStyle = { fontSize:'48px', color:'#ffffff', stroke:'#000000', strokeThickness: 6, align: 'center' };
        this.waveInfoText = this.add.text(this.scale.width/2, this.scale.height/2 - 50, '', textStyle).setOrigin(0.5).setDepth(30);
        this.waveCountdownText = this.add.text(this.scale.width/2, this.scale.height/2 + 20, '', textStyle).setOrigin(0.5).setDepth(30);
        this.time.delayedCall(WaveConfig.initialWaveDelay || 1000, this.startNextWave, [], this);
    }

    startNextWave() {
        this.currentWave++;
        this.waveState = 'IN_WAVE';
        this.waveInfoText.setText(`Onda ${this.currentWave}`).setVisible(true);
        this.waveCountdownText.setVisible(false);
        this.time.delayedCall(2000, () => this.waveInfoText.setVisible(false), [], this);
        const waveDef = WaveConfig.definitions[this.currentWave - 1] || this.generateProceduralWave();
        this.spawnWave(waveDef);
    }

    checkWaveCompletion() {
        if (this.waveState === 'IN_WAVE' && this.enemiesRemaining === 0) {
            this.endWave();
        }
    }

    endWave() {
        this.waveState = 'BETWEEN_WAVES';
        this.waveInfoText.setText('Onda Concluída!').setVisible(true);
        this.waveProgressText.setVisible(false);
        let countdown = (WaveConfig.betweenWavesDelay || 5000) / 1000;
        this.waveCountdownText.setText(`Próxima onda em ${countdown}...`).setVisible(true);
        this.time.addEvent({ delay: 1000, repeat: countdown - 1, callback: () => {
            countdown--;
            this.waveCountdownText.setText(`Próxima onda em ${countdown}...`);
        }});
        this.time.delayedCall(WaveConfig.betweenWavesDelay || 5000, this.startNextWave, [], this);
    }

    spawnWave(waveDef) {
        this.enemiesRemaining = Object.values(waveDef).reduce((a, b) => a + b, 0);
        Object.entries(waveDef).forEach(([enemyId, count]) => {
            for (let i = 0; i < count; i++) {
                this.time.delayedCall(i * (WaveConfig.spawnInterval || 350), () => {
                    this.spawnEnemy(GameData.Enemies[enemyId]);
                });
            }
        });
    }

    generateProceduralWave() {
        const proceduralPoints = WaveConfig.proceduralBasePoints + (this.currentWave - WaveConfig.definitions.length) * WaveConfig.proceduralPointGrowth;
        let pointsRemaining = proceduralPoints;
        const wave = {};
        const enemyTypes = Object.values(GameData.Enemies).filter(e => !e.boss).sort((a, b) => b.cost - a.cost);

        while (pointsRemaining > 0 && enemyTypes.length > 0) {
            const availableEnemies = enemyTypes.filter(e => e.cost <= pointsRemaining);
            if (availableEnemies.length === 0) break;
            const enemyType = availableEnemies[Math.floor(Math.random() * availableEnemies.length)];
            wave[enemyType.id] = (wave[enemyType.id] || 0) + 1;
            pointsRemaining -= enemyType.cost;
        }
        return wave;
    }

    createProjectileGroup(texture) {
        return this.physics.add.group({
            defaultKey: texture,
            runChildUpdate: true
        });
    }

    spawnEnemy(data) {
        const padding = 100;
        const { width, height } = this.scale;
        let x, y;
        if (Math.random() > 0.5) { // Spawn nas laterais
            x = Phaser.Math.RND.pick([-padding, width + padding]);
            y = Phaser.Math.RND.between(-padding, height + padding);
        } else { // Spawn em cima/baixo
            x = Phaser.Math.RND.between(-padding, width + padding);
            y = Phaser.Math.RND.pick([-padding, height + padding]);
        }

        const enemy = this.enemies.get(x, y, data.texture);
        if (enemy) {
            enemy.spawn(data, this.currentWave);
            enemy.setAlpha(0).setScale(0.5);
            this.tweens.add({ targets: enemy, alpha: 1, scale: 1, duration: 400, ease: 'Back.easeOut' });
        }
    }

    tryUseSpecialAbility() {
        const now = this.time.now;
        const last = this.player.getData('lastSpecialAttack') || 0;
        const cooldown = this.selectedClass.ability.cooldown;
        if ((now - last) < cooldown) return;

        if (this.selectedClass.ability.radius > 0) {
            this.isTargetingAbility = true;
            this.abilityTargetMarker.setVisible(true);
        } else {
            this.executeSpecialAbility({ x: this.player.x, y: this.player.y });
        }
    }

    executeSpecialAbility(targetPos) {
        this.player.setData('lastSpecialAttack', this.time.now);
        const abilityMap = {
            CACADOR: useArrowRain,
            GUERREIRO: useShockwave
        };
        const abilityFn = abilityMap[this.selectedClass.id];
        if (abilityFn) {
            abilityFn(this, targetPos);
        }
    }

    pauseMenu() {
        // Menu de pausa estilizado
        if (this.pausePanel) return;
        const { width, height } = this.scale;
        this.pausePanel = this.add.graphics().fillStyle(0x222222, 0.85).fillRoundedRect(width/2-180, height/2-120, 360, 240, 24).setDepth(50);
        this.pauseText = this.add.text(width/2, height/2-60, 'Jogo Pausado', { fontSize: '36px', color: '#fff', fontFamily: 'Georgia, serif', stroke:'#00ff7f', strokeThickness:4 }).setOrigin(0.5).setDepth(51);
        this.resumeButton = this.add.text(width/2, height/2+40, 'Continuar', { fontSize: '28px', color: '#00ff7f', backgroundColor:'#333', fontFamily: 'Georgia, serif', padding:{top:8,bottom:8,left:20,right:20}, stroke:'#000', strokeThickness:3 }).setOrigin(0.5).setDepth(51).setInteractive({useHandCursor:true});

        // Pausa a cena para interromper a atualização do jogo enquanto o menu estiver ativo
        this.scene.pause();

        this.resumeButton.on('pointerdown', () => {
            this.pausePanel.destroy();
            this.pauseText.destroy();
            this.resumeButton.destroy();
            this.pausePanel = null;
            this.scene.resume();
        });

        // Garante que o botão continue recebendo eventos mesmo com a cena pausada
        this.input.enable(this.resumeButton);

        this.input.keyboard.once('keydown-ESC', () => {
            if (this.pausePanel) {
                this.pausePanel.destroy();
                this.pauseText.destroy();
                this.resumeButton.destroy();
                this.pausePanel = null;
                this.scene.resume();
            }
        });
    }
}
