// --- DADOS E CONFIGURAÇÕES GLOBAIS ---
        const GameData = {
            Classes: {
                CACADOR: {
                    id: 'CACADOR', nome: 'Caçador das Sombras', desc: 'Mestre do arco e das armadilhas furtivas.', cor: 0x8e44ad,
                    velocidade: 230, vida: 90, dano: 22, attackType: 'ranged', attackCooldown: 350,
                    critChance: 0.15, critMultiplier: 1.5,
                    // ✨ Habilidade Especial do Caçador
                    ability: { name: 'Chuva de Flechas', cooldown: 12000, damageMultiplier: 0.5, waves: 4, duration: 2000, radius: 120, icon: 'arrow-rain-icon' }
                },
                GUERREIRO: {
                    id: 'GUERREIRO', nome: 'Guerreiro de Ossos', desc: 'A força bruta da floresta, inabalável.', cor: 0xc0392b,
                    velocidade: 170, vida: 180, dano: 25, attackType: 'melee', attackRange: 80, attackCooldown: 400,
                    damageReduction: 0.15,
                    // ✨ Habilidade Especial do Guerreiro
                    ability: { name: 'Impacto Sísmico', cooldown: 15000, damageMultiplier: 1, stunDuration: 2000, radius: 150, icon: 'shockwave-icon' }
                }
            },
            Enemies: {
                TATU_ZUMBI: { id: 'TATU_ZUMBI', nome: 'Tatu Zumbi', texture: 'enemy-texture', cor: 0x7f8c8d, velocidade: 60, vida: 80, dano: 10, xp: 50, ai: 'melee', cost: 1 },
                ARANHA_DE_DARDO: { id: 'ARANHA_DE_DARDO', nome: 'Aranha de Dardo', texture: 'enemy-spider-texture', cor: 0x3498db, velocidade: 80, vida: 60, dano: 15, xp: 75, ai: 'ranged', attackDelay: 2000, attackRange: 350, cost: 2 }
            }
        };

        const WaveConfig = {
            definitions: [
                { TATU_ZUMBI: 5 }, { TATU_ZUMBI: 8 }, { TATU_ZUMBI: 5, ARANHA_DE_DARDO: 3 }, { ARANHA_DE_DARDO: 7 }, { TATU_ZUMBI: 12 },
                { TATU_ZUMBI: 8, ARANHA_DE_DARDO: 6 }, { ARANHA_DE_DARDO: 10 }, { TATU_ZUMBI: 15, ARANHA_DE_DARDO: 5 }, { ARANHA_DE_DARDO: 15 }, { TATU_ZUMBI: 10, ARANHA_DE_DARDO: 10 }
            ],
            spawnInterval: 350, initialWaveDelay: 1000, betweenWavesDelay: 5000, proceduralBasePoints: 12, proceduralPointGrowth: 3
        };

        // --- CLASSES AUXILIARES ---
        class Joystick {
            constructor(scene, isAttackJoystick = false) { this.scene = scene; this.isAttackJoystick = isAttackJoystick; this.base = scene.add.circle(0, 0, 70, 0x000000, 0.3).setDepth(10).setVisible(false); this.thumb = scene.add.circle(0, 0, 35, 0xffffff, 0.4).setDepth(10).setVisible(false); this.vector = new Phaser.Math.Vector2(0, 0); this.fireDirection = new Phaser.Math.Vector2(0, -1); this.pointer = null; }
            activate(pointer) { this.pointer = pointer; this.base.setPosition(pointer.x, pointer.y).setVisible(true); this.thumb.setPosition(pointer.x, pointer.y).setVisible(true); } // NOVO: Bloqueia joystick durante mira
            deactivate() { if (this.isAttackJoystick && this.scene.player.active) { this.scene.fireAttack(this.fireDirection); } this.pointer = null; this.vector.set(0, 0); this.base.setVisible(false); this.thumb.setVisible(false); }
            update() { if (!this.pointer) return; const angle = Phaser.Math.Angle.Between(this.base.x, this.base.y, this.pointer.x, this.pointer.y); const dist = Math.min(this.base.radius, Phaser.Math.Distance.Between(this.base.x, this.base.y, this.pointer.x, this.pointer.y)); this.thumb.x = this.base.x + dist * Math.cos(angle); this.thumb.y = this.base.y + dist * Math.sin(angle); this.vector.set(this.thumb.x - this.base.x, this.thumb.y - this.base.y); if (this.vector.length() > 0) { this.vector.normalize(); this.fireDirection.copy(this.vector); } }
        }

        class Enemy extends Phaser.Physics.Arcade.Sprite {
            constructor(scene, x, y, texture) { super(scene, x, y, texture); this.healthBar = scene.healthBars.get(); if (this.healthBar) { this.healthBar.setActive(true).setVisible(true); } this.stunEffect = scene.add.text(0, 0, '★', { fontSize: '24px', color: '#ffff00', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setVisible(false).setDepth(1); }
            spawn(data, waveNum) { this.stats = { ...data }; this.applyWaveScaling(waveNum); this.setData({ hp: this.stats.vida, maxHp: this.stats.vida, lastAttackTime: 0, isDying: false, isStunned: false }); this.setActive(true); this.setVisible(true); this.body.enable = true; this.setImmovable(false).setCollideWorldBounds(true); this.setAlpha(1).setScale(1); if (this.healthBar) { this.healthBar.setActive(true).setVisible(true); } this.updateHealthBar(); }
            applyWaveScaling(waveNum) { if (waveNum > 5) { const scaleFactor = 1 + (waveNum - 5) * 0.08; this.stats.vida = Math.ceil(this.stats.vida * scaleFactor); this.stats.dano = Math.ceil(this.stats.dano * scaleFactor); this.stats.velocidade = this.stats.velocidade * (1 + (waveNum - 5) * 0.05); } }
            update(time, delta) { if (!this.active || !this.scene.player.active) { this.body.setVelocity(0,0); return; } this.runAI(time); this.updateHealthBar(); this.stunEffect.setPosition(this.x, this.y - this.height).setVisible(this.getData('isStunned')); } // NOVO: Pausa IA durante mira
            runAI(time) { if (this.getData('isStunned')) { this.body.setVelocity(0,0); return; } const { ai, velocidade, attackRange, attackDelay } = this.stats; const player = this.scene.player; const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y); switch (ai) { case 'melee': this.scene.physics.moveToObject(this, player, velocidade); break; case 'ranged': if (distance > attackRange) { this.scene.physics.moveToObject(this, player, velocidade); } else { this.body.setVelocity(0, 0); const lastAttackTime = this.getData('lastAttackTime') || 0; if (time > lastAttackTime + attackDelay) { this.scene.enemyFireAttack(this); this.setData('lastAttackTime', time); } } break; } }
            takeDamage(amount, isCrit = false) { if (!this.active || this.getData('isDying')) return; const newHp = this.getData('hp') - amount; this.setData('hp', newHp); this.scene.showFloatingText(Math.round(amount), this.x, this.y, isCrit); this.updateHealthBar(); if (newHp <= 0) { this.setData('isDying', true); this.scene.defeatTarget(this); } }
            updateHealthBar() { if (!this.healthBar || !this.active) return; this.healthBar.setPosition(this.x - 16, this.y - 30); const pct = Math.max(0, this.getData('hp') / this.getData('maxHp')); this.healthBar.clear().fillStyle(0x000000, 0.7).fillRoundedRect(0, 0, 32, 8, 3).fillStyle(0xff0000).fillRoundedRect(1, 1, 30 * pct, 6, 2); }
            die() { this.scene.gainXP(this.stats.xp); if (this.healthBar) { this.healthBar.setActive(false).setVisible(false); } this.stunEffect.destroy(); this.scene.tweens.add({ targets: this, alpha: 0, scale: 0, duration: 300, ease: 'Power2', onComplete: () => { this.setActive(false).setVisible(false); this.body.enable = false; } }); }
        }

        // --- CENAS DE MENU ---
        class SplashScreenScene extends Phaser.Scene {
            constructor() { super('SplashScreenScene'); }
            preload() { const treeGfx = this.make.graphics({ add: false }); treeGfx.fillStyle(0x5D4037, 1).fillRect(110, 200, 80, 150); treeGfx.fillStyle(0x388E3C, 1).fillCircle(150, 150, 100).fillCircle(90, 180, 70).fillCircle(210, 180, 70); treeGfx.generateTexture('title-image', 300, 350).destroy(); }
            create() {
                this.cameras.main.setBackgroundColor('#1a1a1a');
                const { width, height } = this.scale;
                this.add.text(width/2, height * 0.2, 'Contos de Arandú', { fontSize: '52px', color: '#00ff7f', fontFamily:'Georgia, serif', stroke:'#000', strokeThickness:8 }).setOrigin(0.5).setWordWrapWidth(width * 0.9);
                this.add.image(width/2, height/2, 'title-image').setAlpha(0.8);
                this.add.text(width/2, height - 80, 'Desenvolvido por Bruno Menezes', { fontSize:'22px', color:'#ccc', fontStyle:'italic' }).setOrigin(0.5);
                const pressText = this.add.text(width/2, height - 30, 'Toque para continuar', { fontSize:'28px', color:'#fff' }).setOrigin(0.5).setAlpha(0);
                this.tweens.add({ targets: pressText, alpha:1, duration:1000, ease:'Power1', yoyo:true, repeat:-1, delay:1000 });
                this.input.once('pointerdown', ()=> { this.cameras.main.fadeOut(500, 0, 0, 0); this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, ()=> this.scene.start('CharacterSelectScene')); });
            }
        }
        class CharacterSelectScene extends Phaser.Scene {
            constructor() { super('CharacterSelectScene'); }
            create() {
                this.cameras.main.fadeIn(500, 0, 0, 0);
                this.cameras.main.setBackgroundColor('#1a1a1a');
                const { width, height } = this.scale;
                this.add.text(width/2, height * 0.15,'Escolha seu Destino',{ fontSize:'48px', color:'#00ff7f', fontFamily:'Georgia, serif', stroke:'#000', strokeThickness:6 }).setOrigin(0.5).setWordWrapWidth(width * 0.9);
                this.createClassButton(width/2, height * 0.4, GameData.Classes.CACADOR);
                this.createClassButton(width/2, height * 0.65, GameData.Classes.GUERREIRO);
            }
            createClassButton(x,y,classData) {
                const w = this.scale.width * 0.8;
                const h = 120;
                const btn=this.add.container(x,y);
                const bg=this.add.graphics().fillStyle(0x000000,0.5).fillRoundedRect(-w/2,-h/2,w,h,16).lineStyle(3,classData.cor,0.8).strokeRoundedRect(-w/2,-h/2,w,h,16);
                const title=this.add.text(-w/2+30,-h/2 + 25,classData.nome,{fontSize:'32px',color:'#fff',fontStyle:'bold'});
                const desc=this.add.text(-w/2+30,-h/2 + 65,classData.desc,{fontSize:'20px',color:'#ccc', wordWrap: { width: w - 60 }});
                btn.add([bg,title,desc]).setSize(w,h).setInteractive({useHandCursor:true});
                const glow=bg.postFX.addGlow(classData.cor,1,0,false,0.1,12).setActive(false);
                btn.on('pointerover',()=> glow.setActive(true)).on('pointerout',()=>{glow.setActive(false);btn.setScale(1);}).on('pointerdown',()=>btn.setScale(0.98)).on('pointerup',()=>{btn.setScale(1);this.scene.start('DungeonScene',{selectedClass:classData});});
            }
        }

        class UIScene extends Phaser.Scene {
            constructor() { super('UIScene'); }
            init(data) { this.playerData = data.playerData; this.classData = data.classData; }
            create() {
                const { width, height } = this.scale;
                this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0);
                const panelWidth = Math.min(width * 0.9, 600);
                const panelHeight = Math.min(height * 0.8, 450);
                const panelX = width / 2;
                const panelY = height / 2;
                const panel = this.add.graphics();
                panel.fillStyle(0x1a1a1a, 1).fillRoundedRect(panelX - panelWidth / 2, panelY - panelHeight / 2, panelWidth, panelHeight, 16);
                panel.lineStyle(2, this.classData.cor, 1).strokeRoundedRect(panelX - panelWidth / 2, panelY - panelHeight / 2, panelWidth, panelHeight, 16);
                this.add.text(panelX, panelY - panelHeight / 2 + 30, `Perfil: ${this.classData.nome}`, { fontSize: '28px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
                const closeButton = this.add.text(panelX + panelWidth / 2 - 30, panelY - panelHeight / 2 + 30, 'X', { fontSize: '28px', color: '#ff0000', fontStyle: 'bold' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
                closeButton.on('pointerdown', () => this.closeMenu());
                const attrX = panelX - panelWidth / 2 + 40;
                let attrY = panelY - panelHeight / 2 + 80;
                const labelStyle = { fontSize: '18px', color: '#cccccc' };
                const valueStyle = { fontSize: '18px', color: '#ffffff', fontStyle: 'bold' };
                this.createAttributeLine(attrX, attrY, 'Nível:', this.playerData.level, labelStyle, valueStyle); attrY += 30;
                this.createAttributeLine(attrX, attrY, 'Experiência:', `${this.playerData.xp} / ${this.playerData.xpToNextLevel}`, labelStyle, valueStyle); attrY += 30;
                this.createAttributeLine(attrX, attrY, 'Vida:', `${Math.round(this.playerData.hp)} / ${this.playerData.maxHp}`, labelStyle, valueStyle); attrY += 30;
                this.createAttributeLine(attrX, attrY, 'Dano Base:', this.playerData.damage, labelStyle, valueStyle); attrY += 30;
                this.createAttributeLine(attrX, attrY, 'Velocidade:', this.classData.velocidade, labelStyle, valueStyle); attrY += 40;
                if (this.classData.damageReduction) { this.createAttributeLine(attrX, attrY, 'Redução de Dano:', `${this.classData.damageReduction * 100}%`, labelStyle, valueStyle); attrY += 30; }
                if (this.classData.critChance) { this.createAttributeLine(attrX, attrY, 'Chance de Crítico:', `${this.classData.critChance * 100}%`, labelStyle, valueStyle); attrY += 30; this.createAttributeLine(attrX, attrY, 'Dano Crítico:', `+${(this.classData.critMultiplier - 1) * 100}%`, labelStyle, valueStyle); attrY += 30; }
                const placeholderX = panelX + 50;
                const placeholderY = panelY - panelHeight / 2 + 80;
                const placeholderW = panelWidth / 2 - 80;
                const placeholderH = panelHeight - 120;
                this.createPlaceholderBox(placeholderX, placeholderY, placeholderW, placeholderH / 2 - 10, 'Equipamentos');
                this.createPlaceholderBox(placeholderX, placeholderY + placeholderH / 2 + 10, placeholderW, placeholderH / 2 - 10, 'Itens');

                // Botão para retornar à seleção de personagem
                const returnButton = this.add.text(panelX, panelY + panelHeight / 2 - 35, 'Voltar à Seleção', {
                    fontSize: '20px', color: '#ffc107', fontStyle: 'bold', align: 'center',
                    backgroundColor: '#333', padding: { top: 8, bottom: 8, left: 15, right: 15 }
                }).setOrigin(0.5).setInteractive({ useHandCursor: true });

                returnButton.on('pointerdown', () => {
                    this.scene.stop('DungeonScene');
                    this.scene.stop(); // Para a própria UIScene
                    this.scene.start('CharacterSelectScene');
                });

                this.input.keyboard.once('keydown-ESC', () => this.closeMenu());
            }
            createAttributeLine(x, y, label, value, labelStyle, valueStyle) { this.add.text(x, y, label, labelStyle).setOrigin(0, 0.5); this.add.text(x + 180, y, value, valueStyle).setOrigin(0, 0.5); }
            createPlaceholderBox(x, y, w, h, title) { const box = this.add.graphics(); box.fillStyle(0x000000, 0.3).fillRoundedRect(x, y, w, h, 8); box.lineStyle(1, 0x444444, 1).strokeRoundedRect(x, y, w, h, 8); this.add.text(x + w / 2, y + 20, title, { fontSize: '20px', color: '#aaaaaa' }).setOrigin(0.5); this.add.text(x + w / 2, y + h / 2, '(Vazio)', { fontSize: '18px', color: '#666666', fontStyle: 'italic' }).setOrigin(0.5); }
            closeMenu() { this.scene.resume('DungeonScene'); this.scene.stop(); }
        }

        // --- CENA PRINCIPAL DO JOGO ---
        class DungeonScene extends Phaser.Scene {
            constructor(){ super('DungeonScene'); }

            init(data){
                this.selectedClass = data.selectedClass;
                // NOVO: Estado para controlar a mira da habilidade
                this.isTargetingAbility = false;
            }

            preload(){
                // Player
                const pGfx = this.make.graphics({add:false});
                pGfx.fillStyle(this.selectedClass.cor,1).fillCircle(20,20,20);
                pGfx.lineStyle(2,0xffffff,0.8).strokeCircle(20,20,20);
                pGfx.generateTexture('player-texture',40,40).destroy();

                // Tatu Zumbi: corpo oval, casco, olhos vermelhos
                const eGfx = this.make.graphics({add:false});
                eGfx.fillStyle(GameData.Enemies.TATU_ZUMBI.cor,1).fillEllipse(15,18,28,22);
                eGfx.fillStyle(0x444444,1).fillEllipse(15,18,18,12); // casco
                eGfx.fillStyle(0xff3333,1).fillCircle(8,14,2).fillCircle(22,14,2); // olhos
                eGfx.lineStyle(2,0x222222).strokeEllipse(15,18,28,22);
                eGfx.generateTexture(GameData.Enemies.TATU_ZUMBI.texture,30,30).destroy();

                // Aranha de Dardo: corpo, cabeça, pernas, ferrão
                const sGfx = this.make.graphics({add:false});
                sGfx.fillStyle(GameData.Enemies.ARANHA_DE_DARDO.cor,1).fillCircle(18,20,12); // corpo
                sGfx.fillStyle(0x222222,1).fillCircle(18,10,6); // cabeça
                // Pernas
                sGfx.lineStyle(2,0x222222);
                for(let i=0;i<8;i++){
                    const a = Math.PI/4*i;
                    sGfx.beginPath();
                    sGfx.moveTo(18,20);
                    sGfx.lineTo(18+18*Math.cos(a),20+18*Math.sin(a));
                    sGfx.strokePath();
                }
                // Ferrão
                sGfx.fillStyle(0xffcc00,1).fillTriangle(18,32,22,36,14,36);
                // Olhos
                sGfx.fillStyle(0xffffff,1).fillCircle(16,8,1.5).fillCircle(20,8,1.5);
                sGfx.generateTexture(GameData.Enemies.ARANHA_DE_DARDO.texture,36,40).destroy();

                // Projetéis e ícones
                const prGfx=this.make.graphics({add:false}); prGfx.fillStyle(0xffff00,1).fillCircle(5,5,5); prGfx.generateTexture('player-projectile-texture',10,10).destroy();
                const epGfx=this.make.graphics({add:false}); epGfx.fillStyle(0x9b59b6,1).fillTriangle(0,0,10,0,5,10); epGfx.generateTexture('enemy-projectile-texture',10,10).destroy();
                const iconGfx = this.make.graphics({add: false}); iconGfx.fillStyle(0xffffff, 1).fillCircle(20, 12, 10).fillCircle(20, 35, 18); iconGfx.generateTexture('profile-icon', 40, 40);

                // Ícones das habilidades
                const shockwaveIcon = this.make.graphics({add:false}); shockwaveIcon.lineStyle(4, 0xffffff).beginPath().arc(25, 25, 10, 0, Math.PI * 2).strokePath().arc(25, 25, 20, 0, Math.PI * 2).strokePath(); shockwaveIcon.generateTexture('shockwave-icon', 50, 50);
                const arrowRainIcon = this.make.graphics({add:false}); arrowRainIcon.fillStyle(0xffffff).fillTriangle(20,10,30,10,25,20).fillTriangle(10,25,20,25,15,35).fillTriangle(30,25,40,25,35,35); arrowRainIcon.generateTexture('arrow-rain-icon', 50, 50);
            }

            create(){
                this.input.addPointer(2);

                // Desktop: auto ataque com espaço
                if (!this.sys.game.device.input.touch) {
                    this.spaceAttackInterval = null;
                    this.input.keyboard.on('keydown-SPACE', () => {
                        if (!this.spaceAttackInterval) {
                            // Ataca imediatamente
                            let dir = this.lastAttackDirection || new Phaser.Math.Vector2(0, -1);
                            this.fireAttack(dir);
                            // Inicia auto ataque
                            this.spaceAttackInterval = this.time.addEvent({
                                delay: this.selectedClass.attackCooldown,
                                loop: true,
                                callback: () => {
                                    let dir = this.lastAttackDirection || new Phaser.Math.Vector2(0, -1);
                                    this.fireAttack(dir);
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
                this.time.now = 0;
                this.cameras.main.fadeIn(500, 0, 0, 0);
                this.background = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x1a2b1a).setOrigin(0).setDepth(-1);

                this.player = this.physics.add.sprite(this.scale.width/2, this.scale.height/2, 'player-texture').setCollideWorldBounds(true);
                this.player.setData({
                    level: 1, xp: 0, xpToNextLevel: 100,
                    maxHp: this.selectedClass.vida, hp: this.selectedClass.vida,
                    damage: this.selectedClass.dano, isInvulnerable: false,
                    lastAttack: 0, lastSpecialAttack: -Infinity // Permite o primeiro uso imediato
                });

                // --- ARMA VISUAL ---
                let armaKey, armaGfx;
                if (this.selectedClass.id === 'CACADOR') {
                    armaKey = 'zarabatana';
                    armaGfx = this.make.graphics({add:false});
                    armaGfx.fillStyle(0x333333, 1).fillRect(0, 0, 38, 8);
                    armaGfx.fillStyle(0x228B22, 1).fillCircle(36, 4, 6);
                    armaGfx.generateTexture('zarabatana', 40, 12).destroy();
                } else if (this.selectedClass.id === 'GUERREIRO') {
                    armaKey = 'machado';
                    armaGfx = this.make.graphics({add:false});
                    armaGfx.fillStyle(0x8B4513, 1).fillRect(0, 4, 28, 6); // cabo
                    armaGfx.fillStyle(0xcccccc, 1).fillRect(24, 0, 12, 14); // lâmina
                    armaGfx.fillStyle(0x888888, 1).fillRect(32, 2, 6, 10); // detalhe
                    armaGfx.generateTexture('machado', 40, 16).destroy();
                }
                this.weaponSprite = this.add.sprite(this.player.x, this.player.y, armaKey).setOrigin(0.1, 0.5).setDepth(2);

                this.playerAttacks = this.createProjectileGroup('player-projectile-texture', 30);
                this.enemyAttacks = this.createProjectileGroup('enemy-projectile-texture', 40);

                this.healthBars = this.add.group({ classType: Phaser.GameObjects.Graphics });
                this.floatingTexts = this.add.group({ classType: Phaser.GameObjects.Text, defaultKey: 'text', maxSize: 50 });
                this.enemies = this.physics.add.group({ classType: Enemy, runChildUpdate: true, maxSize: 60 });

                this.physics.add.collider(this.player, this.enemies, this.playerHitEnemy, null, this);
                this.physics.add.collider(this.enemies, this.enemies);

                this.physics.add.overlap(this.playerAttacks, this.enemies, this.projectileHitEnemy, null, this);
                this.physics.add.overlap(this.player, this.enemyAttacks, this.projectileHitPlayer, null, this);

                this.cursors = this.input.keyboard.createCursorKeys();
                this.moveJoystick = new Joystick(this);
                this.attackJoystick = new Joystick(this, true);

                // NOVO: Marcador visual para a área da habilidade
                const abilityRadius = this.selectedClass.ability.radius;
                this.abilityTargetMarker = this.add.graphics({
                    fillStyle: { color: this.selectedClass.cor, alpha: 0.4 },
                    lineStyle: { width: 2, color: 0xffffff, alpha: 0.7 }
                }).setDepth(5).setVisible(false);
                this.abilityTargetMarker.fillCircle(0, 0, abilityRadius);
                this.abilityTargetMarker.strokeCircle(0, 0, abilityRadius);

                // NOVO: Evento para confirmar o uso da habilidade
                this.input.on('pointerup', (pointer) => {
                    if (this.isTargetingAbility) {
                        this.isTargetingAbility = false;
                        this.abilityTargetMarker.setVisible(false);

                        // Ativa a habilidade na posição do ponteiro
                        const targetPos = { x: pointer.worldX, y: pointer.worldY };
                        this.executeSpecialAbility(targetPos);
                    }
                }, this);

                this.createHUD();
                this.setupWaveSystem();
                this.scale.on('resize', this.onResize, this);
                this.isLandscape = this.scale.width > this.scale.height;
            }

            update(time, delta){
                this.time.now = time;

                // NOVO: Lógica de atualização do modo de mira
                if (this.isTargetingAbility) {
                    const pointer = this.input.activePointer;
                    this.abilityTargetMarker.setPosition(pointer.worldX, pointer.worldY);
                }

                // Atualiza arma visual
                if (this.weaponSprite && this.player.active) {
                    // Direção do ataque: joystick de ataque > movimento > mantém última direção
                    if (!this.lastAttackDirection) {
                        this.lastAttackDirection = new Phaser.Math.Vector2(0, -1);
                    }
                    let dir = this.lastAttackDirection;
                    if (this.attackJoystick && this.attackJoystick.vector.length() > 0) {
                        dir = this.attackJoystick.vector.clone().normalize();
                        this.lastAttackDirection = dir;
                    } else if (this.player.body.velocity.length() > 0) {
                        dir = this.player.body.velocity.clone().normalize();
                        this.lastAttackDirection = dir;
                    }
                    // Mantém a última direção se parado
                    const offset = 28;
                    this.weaponSprite.x = this.player.x + dir.x * offset;
                    this.weaponSprite.y = this.player.y + dir.y * offset;
                    this.weaponSprite.rotation = dir.angle();
                    this.weaponSprite.setVisible(true);
                }

                if (!this.player.active) {
                    if (this.weaponSprite) this.weaponSprite.setVisible(false);
                    return;
                }
                this.handleControls();
                this.updateSpecialAbilityButton();
            }

            onResize(gameSize) {
                this.isLandscape = gameSize.width > gameSize.height;
                this.background.setSize(gameSize.width, gameSize.height);
                this.cameras.main.setScroll(0, 0);
                this.physics.world.setBounds(0, 0, gameSize.width, gameSize.height);
                this.player.setCollideWorldBounds(true);
                this.repositionHUD(gameSize.width, gameSize.height);
            }

            repositionHUD(width, height) {
                if (this.hudContainer) this.hudContainer.setPosition(20, 20);
                if (this.waveProgressText) this.waveProgressText.setPosition(width - 20, 20);
                if (this.profileButton) this.profileButton.setPosition(width - 40, 40);
                if (this.specialAbilityButton) {
                    const yPos = this.attackJoystick.base.y || height - 80;
                    this.specialAbilityButton.setPosition(width - 80, yPos - 80);
                    this.specialAbilityCooldownText.setPosition(this.specialAbilityButton.x, this.specialAbilityButton.y);
                }
                if (this.waveInfoText) this.waveInfoText.setPosition(width / 2, height / 2 - 50);
                if (this.waveCountdownText) this.waveCountdownText.setPosition(width / 2, height / 2 + 20);
                if (this.gameOverText) this.gameOverText.setPosition(width / 2, height / 2);
            }

            setupWaveSystem() {
                this.currentWave = 0; this.waveState = 'BETWEEN_WAVES'; this.enemiesRemaining = 0;
                const textStyle = { fontSize:'48px', color:'#ffffff', stroke:'#000000', strokeThickness: 6, align: 'center' };
                this.waveInfoText = this.add.text(this.scale.width/2, this.scale.height/2 - 50, '', textStyle).setOrigin(0.5).setDepth(30);
                this.waveCountdownText = this.add.text(this.scale.width/2, this.scale.height/2 + 20, '', textStyle).setOrigin(0.5).setDepth(30);
                this.time.delayedCall(WaveConfig.initialWaveDelay, this.startNextWave, [], this);
            }
            startNextWave() {
                this.currentWave++; this.waveState = 'IN_WAVE';
                this.waveInfoText.setText(`Onda ${this.currentWave}`).setVisible(true);
                this.waveCountdownText.setVisible(false);
                this.time.delayedCall(2000, () => this.waveInfoText.setVisible(false), [], this);
                const waveDef = WaveConfig.definitions[this.currentWave - 1] || this.generateProceduralWave();
                this.spawnWave(waveDef);
            }

            spawnWave(waveDef) {
                let enemiesToSpawn = [];
                for (const enemyKey in waveDef) { for (let i = 0; i < waveDef[enemyKey]; i++) { enemiesToSpawn.push(GameData.Enemies[enemyKey]); } }
                this.enemiesRemaining = enemiesToSpawn.length;
                this.updateWaveProgressText();
                if (this.enemiesRemaining === 0) { this.checkWaveCompletion(); return; }
                let spawnIndex = 0;
                this.time.addEvent({
                    delay: WaveConfig.spawnInterval,
                    repeat: this.enemiesRemaining - 1,
                    callback: () => {
                        if (spawnIndex < enemiesToSpawn.length) {
                            this.spawnEnemy(enemiesToSpawn[spawnIndex]);
                            spawnIndex++;
                        }
                    }
                });
            }

            generateProceduralWave() {
                let points = WaveConfig.proceduralBasePoints + (this.currentWave * WaveConfig.proceduralPointGrowth);
                const newWaveDef = { TATU_ZUMBI: 0, ARANHA_DE_DARDO: 0 };
                while (points > 0) { const canSpawnSpider = points >= GameData.Enemies.ARANHA_DE_DARDO.cost; if (canSpawnSpider && Math.random() > 0.4) { newWaveDef.ARANHA_DE_DARDO++; points -= GameData.Enemies.ARANHA_DE_DARDO.cost; } else { newWaveDef.TATU_ZUMBI++; points -= GameData.Enemies.TATU_ZUMBI.cost; } }
                return newWaveDef;
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
                let countdown = WaveConfig.betweenWavesDelay / 1000;
                this.waveCountdownText.setText(`Próxima onda em ${countdown}...`).setVisible(true);
                this.time.addEvent({ delay: 1000, repeat: countdown - 1, callback: () => { countdown--; this.waveCountdownText.setText(`Próxima onda em ${countdown}...`); } });
                this.time.delayedCall(WaveConfig.betweenWavesDelay, this.startNextWave, [], this);
            }

            createProjectileGroup(texture, maxSize) { const group = this.physics.add.group({ classType: Phaser.Physics.Arcade.Image, maxSize: maxSize }); group.createMultiple({ key: texture, quantity: maxSize, active: false, visible: false }); group.children.iterate(proj => { if (proj) { proj.setCollideWorldBounds(true); proj.body.onWorldBounds = true; } }); this.physics.world.on('worldbounds', (body) => { if (group.contains(body.gameObject)) { body.gameObject.disableBody(true, true); } }); return group; }
            handleControls() { const speed = this.selectedClass.velocidade; this.player.body.setVelocity(0); if (this.cursors.left.isDown) this.player.body.setVelocityX(-speed); else if (this.cursors.right.isDown) this.player.body.setVelocityX(speed); if (this.cursors.up.isDown) this.player.body.setVelocityY(-speed); else if (this.cursors.down.isDown) this.player.body.setVelocityY(speed); this.handleTouch(); this.moveJoystick.update(); this.attackJoystick.update(); if (this.moveJoystick.pointer) { this.player.body.setVelocity(this.moveJoystick.vector.x * speed, this.moveJoystick.vector.y * speed); } if (this.player.body.velocity.length() > speed) { this.player.body.velocity.normalize().scale(speed); } }

            handleTouch() {
                for (const ptr of this.input.manager.pointers) {
                    if (ptr.isDown) {
                        if (this.moveJoystick.pointer === ptr || this.attackJoystick.pointer === ptr) continue;
                        let isMoveZone, isAttackZone;
                        const { width, height } = this.scale;
                        if (this.isLandscape) { isMoveZone = ptr.x < width / 2 && ptr.y > height / 2; isAttackZone = ptr.x > width / 2 && ptr.y > height / 2; }
                        else { isMoveZone = ptr.x < width / 2; isAttackZone = ptr.x > width / 2; }
                        if (isMoveZone && !this.moveJoystick.pointer) { this.moveJoystick.activate(ptr); }
                        else if (isAttackZone && !this.attackJoystick.pointer) { this.attackJoystick.activate(ptr); }
                    } else {
                        if (this.moveJoystick.pointer === ptr) this.moveJoystick.deactivate();
                        if (this.attackJoystick.pointer === ptr) this.attackJoystick.deactivate();
                    }
                }
            }

            spawnEnemy(data) { const x = Phaser.Math.Between(0, this.scale.width); const y = Math.random() < 0.5 ? -30 : this.scale.height + 30; const enemy = this.enemies.get(x, y, data.texture); if (!enemy) return; enemy.spawn(data, this.currentWave); }

            fireAttack(direction) {
                // Se não houver direção explícita (ex: joystick de ataque não está ativo), usa direção do movimento
                let attackDir = direction;
                if (!attackDir || (attackDir.x === 0 && attackDir.y === 0)) {
                    // Usa a direção do movimento do jogador
                    const vel = this.player.body.velocity;
                    if (vel.length() > 0) {
                        attackDir = vel.clone().normalize();
                    } else {
                        // Se parado, atira para cima por padrão
                        attackDir = new Phaser.Math.Vector2(0, -1);
                    }
                }

                const cooldown = this.selectedClass.attackCooldown;
                const lastAttack = this.player.getData('lastAttack');
                if (this.time.now < lastAttack + cooldown) return;
                this.player.setData('lastAttack', this.time.now);

                // Salva velocidade anterior
                const prevVelocity = this.player.body.velocity.clone();

                // Aplica velocidade do ataque apenas se parado
                if (prevVelocity.length() === 0) {
                    const speed = this.selectedClass.velocidade;
                    this.player.body.setVelocity(attackDir.x * speed, attackDir.y * speed);
                }

                if (this.selectedClass.attackType === 'melee') {
                    const attackOffset = 40;
                    const attackPosition = new Phaser.Math.Vector2(this.player.x, this.player.y).add(attackDir.clone().scale(attackOffset));
                    const slashGfx = this.add.graphics({ lineStyle: { width: 4, color: 0xffffff, alpha: 0.8 } });
                    const angle = attackDir.angle();
                    slashGfx.slice(attackPosition.x, attackPosition.y, this.selectedClass.attackRange * 0.7, angle - Math.PI / 4, angle + Math.PI / 4, false);
                    slashGfx.strokePath();
                    this.tweens.add({ targets: slashGfx, alpha: 0, duration: 150, onComplete: () => slashGfx.destroy() });

                    const attackRange = this.selectedClass.attackRange;
                    const attackArea = new Phaser.Geom.Circle(attackPosition.x, attackPosition.y, attackRange);

                    const enemiesToCheck = this.enemies.getMatching('active', true);
                    let closestEnemy = null;
                    let minDistance = Infinity;

                    enemiesToCheck.forEach(enemy => {
                        const enemyBounds = enemy.getBounds();
                        if (Phaser.Geom.Intersects.CircleToRectangle(attackArea, enemyBounds)) {
                            const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
                            if (distance < minDistance) {
                                minDistance = distance;
                                closestEnemy = enemy;
                            }
                        }
                    });

                    if (closestEnemy) {
                        closestEnemy.takeDamage(this.player.getData('damage'));
                    }
                } else {
                    const proj = this.playerAttacks.get(this.player.x, this.player.y);
                    if (!proj) return;

                    let finalDamage = this.player.getData('damage');
                    let isCrit = false;
                    if (Math.random() < this.selectedClass.critChance) {
                        finalDamage *= this.selectedClass.critMultiplier;
                        isCrit = true;
                    }

                    proj.setData({ damage: finalDamage, isCrit: isCrit });
                    proj.enableBody(true, this.player.x, this.player.y, true, true);
                    proj.setVelocity(attackDir.x * 400, attackDir.y * 400);
                }

                // Restaura velocidade anterior se estava se movendo
                if (prevVelocity.length() > 0) {
                    this.player.body.setVelocity(prevVelocity.x, prevVelocity.y);
                }
            }

            enemyFireAttack(enemy) { const proj = this.enemyAttacks.get(enemy.x, enemy.y); if (!proj) return; const damage = enemy.stats.dano; proj.setData('damage', damage); proj.enableBody(true, enemy.x, enemy.y, true, true); const dir = new Phaser.Math.Vector2(this.player.x - enemy.x, this.player.y - enemy.y).normalize(); proj.setVelocity(dir.x * 300, dir.y * 300); }

            projectileHitEnemy(proj, enemy) {
                if (enemy.active) {
                    enemy.takeDamage(proj.getData('damage') || 0, proj.getData('isCrit') || false);
                }
                proj.disableBody(true, true);
            }

            playerHitEnemy(player, enemy) {
                if (enemy.active && !this.player.getData('isInvulnerable')) {
                    this.damagePlayer(enemy.stats.dano);
                }
            }

            projectileHitPlayer(player, proj) { this.damagePlayer(proj.getData('damage') || 0); proj.disableBody(true, true); }

            damagePlayer(amount) {
                if (this.player.getData('isInvulnerable')) return;

                let finalDamage = amount;
                if (this.selectedClass.damageReduction) {
                    finalDamage *= (1 - this.selectedClass.damageReduction);
                }

                this.cameras.main.shake(150, 0.005);
                const newHp = this.player.getData('hp') - finalDamage;
                this.player.setData('hp', newHp);
                this.showFloatingText(Math.round(finalDamage), this.player.x, this.player.y);
                this.updatePlayerHud();
                if (newHp <= 0) {
                    this.defeatTarget(this.player);
                }
                this.player.setData('isInvulnerable', true);
                this.tweens.add({
                    targets: this.player,
                    alpha: 0.5,
                    duration: 100,
                    ease: 'Power1',
                    yoyo: true,
                    repeat: 7,
                    onComplete: () => {
                        this.player.setAlpha(1);
                        this.player.setData('isInvulnerable', false);
                    }
                });
            }

            defeatTarget(target) {
                if (target === this.player) {
                    this.player.disableBody(true,true);
                    this.gameOverText = this.add.text(this.scale.width/2, this.scale.height/2, 'FIM DE JOGO', { fontSize:'56px', color:'#ff3333', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5).setDepth(20);
                } else {
                    target.die();
                    this.enemiesRemaining--;
                    this.updateWaveProgressText();
                    this.checkWaveCompletion();
                }
            }

            gainXP(amount) { let xp = this.player.getData('xp') + amount; let next = this.player.getData('xpToNextLevel'); while (xp >= next) { xp -= next; this.levelUp(); next = this.player.getData('xpToNextLevel'); } this.player.setData('xp', xp); this.showFloatingText(`+${amount} XP`, this.player.x, this.player.y - 40, false, '#00ff7f'); this.updatePlayerHud(); }
            levelUp() { const p = this.player; const newLvl = p.getData('level') + 1; p.setData('level', newLvl); const newMaxHp = Math.floor(p.getData('maxHp') * 1.15); const newDmg = Math.floor(p.getData('damage') * 1.1); p.setData({ maxHp: newMaxHp, hp: newMaxHp, damage: newDmg, xpToNextLevel: Math.floor(p.getData('xpToNextLevel') * 1.5) }); this.showFloatingText('LEVEL UP!', p.x, p.y, false, '#ffff00'); }

            createHUD() {
                this.hudContainer = this.add.container(20, 20).setDepth(20);
                this.playerHudHpBar = this.add.graphics();
                this.playerHudXpBar = this.add.graphics();
                this.levelText = this.add.text(10, 28, '', { fontSize:'20px', color:'#fff', stroke: '#000', strokeThickness: 4 });
                this.hudContainer.add([this.playerHudHpBar, this.playerHudXpBar, this.levelText]);

                this.waveProgressText = this.add.text(this.scale.width - 20, 20, '', { fontSize:'22px', color:'#fff', stroke:'#000', strokeThickness:4, align: 'right' }).setOrigin(1, 0).setDepth(20);

                this.profileButton = this.add.image(this.scale.width - 40, 40, 'profile-icon').setInteractive({ useHandCursor: true }).setDepth(21).setScale(0.8);
                this.profileButton.on('pointerdown', () => {
                    this.scene.pause();
                    this.scene.launch('UIScene', { playerData: this.player.data.getAll(), classData: this.selectedClass });
                });

                // ✨ Botão de Habilidade Especial
                const abilityData = this.selectedClass.ability;
                this.specialAbilityButton = this.add.image(0, 0, abilityData.icon).setInteractive({ useHandCursor: true }).setDepth(21).setScale(1.2);
                
                // MODIFICADO: O 'pointerdown' agora inicia o modo de mira
                this.specialAbilityButton.on('pointerdown', () => this.tryUseSpecialAbility());

                this.specialAbilityCooldownText = this.add.text(0, 0, '', { fontSize: '24px', color: '#ffffff', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5).setDepth(22);

                this.updatePlayerHud();
                this.repositionHUD(this.scale.width, this.scale.height);
            }

            updatePlayerHud() { const hp = Math.max(0, this.player.getData('hp') / this.player.getData('maxHp')); this.playerHudHpBar.clear().fillStyle(0x000, 0.5).fillRoundedRect(0, 0, 204, 24, 5).fillStyle(0x00ff00).fillRoundedRect(2, 2, 200 * hp, 20, 4); const xp = this.player.getData('xp') / this.player.getData('xpToNextLevel'); this.playerHudXpBar.clear().fillStyle(0x000, 0.5).fillRoundedRect(0, 50, 204, 14, 5).fillStyle(0x8a2be2).fillRoundedRect(2, 52, 200 * xp, 10, 4); this.levelText.setText(`Nível: ${this.player.getData('level')}`); }
            updateWaveProgressText() { if (this.waveState === 'IN_WAVE') { this.waveProgressText.setText(`Inimigos: ${this.enemiesRemaining}`).setVisible(true); } else { this.waveProgressText.setVisible(false); } }

            showFloatingText(txt, x, y, isCrit = false, color = '#ffdddd') {
                let finalColor = isCrit ? '#ffff00' : color;
                let finalSize = isCrit ? '26px' : '20px';
                let finalText = isCrit ? `${String(txt)}!` : String(txt);

                const ft = this.floatingTexts.get(x, y, finalText, { fontSize: finalSize, color: finalColor, stroke:'#000', strokeThickness:4, fontStyle: 'bold' });
                if (!ft) return;
                ft.setActive(true).setVisible(true).setOrigin(0.5).setDepth(20).setAlpha(1);
                this.tweens.add({ targets: ft, y: y - 60, alpha: 0, duration: 1500, ease: 'Power1', onComplete: ()=> { ft.setActive(false).setVisible(false); } });
            }

            // MODIFICADO: Renomeado de 'useSpecialAbility' para 'tryUseSpecialAbility'
            tryUseSpecialAbility() {
                const ability = this.selectedClass.ability;
                const lastUse = this.player.getData('lastSpecialAttack');

                if (this.isTargetingAbility || this.time.now < lastUse + ability.cooldown) {
                    return; // Retorna se já estiver mirando ou em cooldown
                }

                if (this.selectedClass.id === 'CACADOR') {
                    // Entra no modo de mira
                    this.isTargetingAbility = true;
                    this.abilityTargetMarker.setVisible(true);
                    const pointer = this.input.activePointer;
                    this.abilityTargetMarker.setPosition(pointer.worldX, pointer.worldY);
                } else {
                    // Guerreiro e outras classes disparam instantaneamente
                    this.executeSpecialAbility({ x: this.player.x, y: this.player.y });
                }
            }
            
            // MODIFICADO: Função que de fato executa a habilidade. Aceita uma posição alvo.
            executeSpecialAbility(targetPos) {
                const ability = this.selectedClass.ability;
                
                // Inicia o cooldown
                this.player.setData('lastSpecialAttack', this.time.now);

                if (this.selectedClass.id === 'GUERREIRO') {
                    const shockwave = this.add.circle(this.player.x, this.player.y, 5, 0xffffff, 0.5).setDepth(0);
                    this.tweens.add({ targets: shockwave, radius: ability.radius, alpha: 0, duration: 400, onComplete: () => shockwave.destroy() });

                    const enemiesToStun = this.enemies.getMatching('active', true);
                    enemiesToStun.forEach(enemy => {
                        if (Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y) <= ability.radius) {
                            enemy.takeDamage(this.player.getData('damage') * ability.damageMultiplier);
                            enemy.setData('isStunned', true);
                            this.time.delayedCall(ability.stunDuration, () => {
                                if (enemy.active) enemy.setData('isStunned', false);
                            });
                        }
                    });
                } else if (this.selectedClass.id === 'CACADOR') {
                    // A posição alvo agora vem do parâmetro `targetPos`
                    const areaMarker = this.add.circle(targetPos.x, targetPos.y, ability.radius, 0x8e44ad, 0.3);
                    this.tweens.add({ targets: areaMarker, alpha: 0, duration: ability.duration, onComplete: () => areaMarker.destroy() });

                    // Dano em ondas na área selecionada
                    this.time.addEvent({
                        delay: ability.duration / ability.waves,
                        repeat: ability.waves - 1,
                        callback: () => {
                            const enemiesInArea = this.enemies.getMatching('active', true);
                            enemiesInArea.forEach(enemy => {
                                if (Phaser.Math.Distance.Between(targetPos.x, targetPos.y, enemy.x, enemy.y) <= ability.radius) {
                                    enemy.takeDamage(this.player.getData('damage') * ability.damageMultiplier);
                                }
                            });
                            // Efeito visual de flechas caindo
                            for(let i = 0; i < 5; i++) {
                                const randX = targetPos.x + Phaser.Math.Between(-ability.radius, ability.radius);
                                const randY = targetPos.y + Phaser.Math.Between(-ability.radius, ability.radius);
                                const arrow = this.add.text(randX, randY - 20, '↓', {fontSize: '20px', color: '#ffffff'}).setOrigin(0.5);
                                this.tweens.add({targets: arrow, y: randY, alpha: 0, duration: 300, delay: i * 50, onComplete: () => arrow.destroy()});
                            }
                        }
                    });
                }
            }

            updateSpecialAbilityButton() {
                const ability = this.selectedClass.ability;
                const lastUse = this.player.getData('lastSpecialAttack');
                const timeLeft = (lastUse + ability.cooldown - this.time.now);

                if (timeLeft > 0) {
                    this.specialAbilityButton.setTint(0x555555);
                    this.specialAbilityCooldownText.setText(Math.ceil(timeLeft / 1000)).setVisible(true);
                } else {
                    this.specialAbilityButton.clearTint();
                    this.specialAbilityCooldownText.setVisible(false);
                }
            }
        }

        // --- CONFIGURAÇÃO DO JOGO ---
        const config = {
            type: Phaser.AUTO,
            input: { activePointers: 3 },
            scale: {
                mode: Phaser.Scale.RESIZE,
                parent: 'game-container',
                width: '100%',
                height: '100%'
            },
            physics: { default: 'arcade', arcade: { debug: false } },
            scene: [SplashScreenScene, CharacterSelectScene, DungeonScene, UIScene]
        };

        new Phaser.Game(config);