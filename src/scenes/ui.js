// ui.js
// Cena de interface do usuário (UI)
// Dependências: Phaser, GameData

// ui.js
// Cena de interface do usuário (UI)
// Dependências: Phaser, GameData


export default class UIScene extends Phaser.Scene {
    constructor() { super('UIScene'); }
    init(data) { this.playerData = data.playerData; this.classData = data.classData; }
    create() {
        this.dungeonScene = this.scene.get('DungeonScene');
        this.player = this.dungeonScene.player;
        this.playerData = this.player.data.getAll();

        const { width, height } = this.scale;
        // Painel adaptativo para mobile
        const panelWidth = Math.min(width * 0.98, 350);
        const panelHeight = Math.min(height * 0.95, 600);
        const panelX = width / 2;
        const panelY = height / 2;

        this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0);

        const panel = this.add.graphics();
        panel.fillStyle(0x1a1a1a, 1).fillRoundedRect(panelX - panelWidth / 2, panelY - panelHeight / 2, panelWidth, panelHeight, 12);
        panel.lineStyle(2, this.classData.cor, 1).strokeRoundedRect(panelX - panelWidth / 2, panelY - panelHeight / 2, panelWidth, panelHeight, 12);

        // Título e botão fechar
        this.add.text(panelX, panelY - panelHeight / 2 + 25, `Perfil: ${this.classData.nome}`, { fontSize: `${Math.round(panelWidth/15)}px`, color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
        const closeButton = this.add.text(panelX + panelWidth / 2 - 22, panelY - panelHeight / 2 + 25, '✕', { fontSize: `${Math.round(panelWidth/15)}px`, color: '#ff4444', fontStyle: 'bold' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        closeButton.on('pointerdown', () => this.closeMenu());

        // Container scrollável para atributos
        const attrContainer = this.add.container(panelX - panelWidth / 2 + 20, panelY - panelHeight / 2 + 60);
        let attrY = 0;
        const labelStyle = { fontSize: `${Math.round(panelWidth/22)}px`, color: '#cccccc' };
        const valueStyle = { fontSize: `${Math.round(panelWidth/22)}px`, color: '#ffffff', fontStyle: 'bold' };

        // Linhas de atributos
        this.levelValue = this.createAttributeLineMobile(attrContainer, 0, attrY, 'Nível:', this.playerData.level, labelStyle, valueStyle); attrY += 28;
        this.xpValue = this.createAttributeLineMobile(attrContainer, 0, attrY, 'Experiência:', `${this.playerData.xp} / ${this.playerData.xpToNextLevel}`, labelStyle, valueStyle); attrY += 28;
        this.hpValue = this.createAttributeLineMobile(attrContainer, 0, attrY, 'Vida:', `${Math.round(this.playerData.hp)} / ${this.playerData.maxHp}`, labelStyle, valueStyle); attrY += 28;
        this.damageValue = this.createAttributeLineMobile(attrContainer, 0, attrY, 'Dano:', this.playerData.damage, labelStyle, valueStyle); attrY += 28;
        this.speedValue = this.createAttributeLineMobile(attrContainer, 0, attrY, 'Velocidade:', this.playerData.speed || this.classData.velocidade, labelStyle, valueStyle); attrY += 28;
        this.cooldownValue = this.createAttributeLineMobile(attrContainer, 0, attrY, 'Cooldown Ataque:', (this.playerData.attackCooldown || this.classData.attackCooldown) + 'ms', labelStyle, valueStyle); attrY += 28;

        // Atributos com botões maiores
        const attrs = this.playerData.attributes || {};
        this.attrTexts = {};
        this.plusButtons = [];
        this.attrTexts.FOR = this.createAttributeLineMobile(attrContainer, 0, attrY, 'Força:', attrs.FOR ?? 0, labelStyle, valueStyle, 'FOR'); attrY += 32;
        this.attrTexts.AGI = this.createAttributeLineMobile(attrContainer, 0, attrY, 'Agilidade:', attrs.AGI ?? 0, labelStyle, valueStyle, 'AGI'); attrY += 32;
        this.attrTexts.VIT = this.createAttributeLineMobile(attrContainer, 0, attrY, 'Vitalidade:', attrs.VIT ?? 0, labelStyle, valueStyle, 'VIT'); attrY += 32;
        this.attrTexts.DES = this.createAttributeLineMobile(attrContainer, 0, attrY, 'Destreza:', attrs.DES ?? 0, labelStyle, valueStyle, 'DES'); attrY += 32;
        this.attrTexts.SOR = this.createAttributeLineMobile(attrContainer, 0, attrY, 'Sorte:', attrs.SOR ?? 0, labelStyle, valueStyle, 'SOR'); attrY += 32;

        this.attributePointsText = this.createAttributeLineMobile(attrContainer, 0, attrY, 'Pontos de Atributo:', this.playerData.attributePoints, labelStyle, valueStyle); attrY += 32;

        if (this.playerData.damageReduction) {
            this.createAttributeLineMobile(attrContainer, 0, attrY, 'Redução de Dano:', Math.round(this.playerData.damageReduction * 100) + '%', labelStyle, valueStyle); attrY += 32;
        }
        if (this.playerData.critChance) {
            this.createAttributeLineMobile(attrContainer, 0, attrY, 'Chance de Crítico:', Math.round(this.playerData.critChance * 100) + '%', labelStyle, valueStyle); attrY += 32;
        }

        // Scroll se necessário
        if (attrY > panelHeight - 120) {
            attrContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, panelWidth - 40, panelHeight - 120), Phaser.Geom.Rectangle.Contains);
            this.input.setDraggable(attrContainer);
            attrContainer.on('drag', (pointer, dragX, dragY) => {
                attrContainer.y = Phaser.Math.Clamp(dragY, panelY - panelHeight / 2 + 60 - (attrY - (panelHeight - 120)), panelY - panelHeight / 2 + 60);
            });
        }

        // Botão voltar maior
        const returnButton = this.add.text(panelX, panelY + panelHeight / 2 - 30, 'Voltar à Seleção', {
            fontSize: `${Math.round(panelWidth/18)}px`, color: '#ffc107', fontStyle: 'bold', align: 'center',
            backgroundColor: '#333', padding: { top: 10, bottom: 10, left: 20, right: 20 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        returnButton.on('pointerdown', () => {
            this.scene.stop();
            this.scene.start('CharacterSelectScene');
        });

        this.input.keyboard.once('keydown-ESC', () => this.closeMenu());
        this.refresh();
    }

    // Novo método para linha de atributo mobile
    createAttributeLineMobile(container, x, y, label, value, labelStyle, valueStyle, attr) {
        container.add(this.add.text(x, y, label, labelStyle).setOrigin(0, 0.5));
        const valueText = this.add.text(x + 120, y, value, valueStyle).setOrigin(0, 0.5);
        container.add(valueText);
        if (attr) {
            const btn = this.add.text(x + 200, y, '+', { fontSize: '22px', color: '#00ff7f', backgroundColor: '#222', padding: { left: 8, right: 8, top: 2, bottom: 2 } }).setOrigin(0, 0.5);
            btn.setInteractive({ useHandCursor: true });
            btn.on('pointerdown', () => this.increaseAttribute(attr));
            this.plusButtons.push(btn);
            container.add(btn);
        }
        return valueText;
    }

    addPlusButton(x, y, attr) {
        const btn = this.add.text(x + 220, y, '+', { fontSize: '18px', color: '#00ff7f' }).setOrigin(0, 0.5);
        btn.setInteractive({ useHandCursor: true });
        btn.on('pointerdown', () => this.increaseAttribute(attr));
        this.plusButtons.push(btn);
    }

    increaseAttribute(attr) {
        if (this.player.allocateAttribute(attr)) {
            this.refresh();
        }
    }

    refresh() {
        this.playerData = this.player.data.getAll();
        const attrs = this.playerData.attributes;
        this.hpValue.setText(`${Math.round(this.playerData.hp)} / ${this.playerData.maxHp}`);
        this.damageValue.setText(this.playerData.damage);
        this.speedValue.setText(this.playerData.speed);
        this.cooldownValue.setText(this.playerData.attackCooldown + 'ms');
        this.attrTexts.FOR.setText(attrs.FOR);
        this.attrTexts.AGI.setText(attrs.AGI);
        this.attrTexts.VIT.setText(attrs.VIT);
        this.attrTexts.DES.setText(attrs.DES);
        this.attrTexts.SOR.setText(attrs.SOR);
        this.attributePointsText.setText(this.playerData.attributePoints);
        const enabled = this.playerData.attributePoints > 0;
        this.plusButtons.forEach(btn => {
            btn.setAlpha(enabled ? 1 : 0.3);
            if (enabled) btn.setInteractive({ useHandCursor: true }); else btn.disableInteractive();
        });
    }
    createPlaceholderBox(x, y, w, h, title) {
        const box = this.add.graphics();
        box.fillStyle(0x000000, 0.3).fillRoundedRect(x, y, w, h, 8);
        box.lineStyle(1, 0x444444, 1).strokeRoundedRect(x, y, w, h, 8);
        this.add.text(x + w / 2, y + 20, title, { fontSize: '20px', color: '#aaaaaa' }).setOrigin(0.5);
        this.add.text(x + w / 2, y + h / 2, '(Vazio)', { fontSize: '18px', color: '#666666', fontStyle: 'italic' }).setOrigin(0.5);
    }
    closeMenu() {
        this.scene.resume('DungeonScene');
        this.scene.stop();
    }
}
