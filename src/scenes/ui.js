// ui.js
// Cena de interface do usuário (UI)
// Dependências: Phaser, GameData

// ui.js
// Cena de interface do usuário (UI)
// Dependências: Phaser, GameData

import { GameData } from '../data/data.js';

export default class UIScene extends Phaser.Scene {
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
        this.createAttributeLine(attrX, attrY, 'Dano:', this.playerData.damage, labelStyle, valueStyle); attrY += 30;
        this.createAttributeLine(attrX, attrY, 'Velocidade:', this.playerData.velocidade || this.classData.velocidade, labelStyle, valueStyle); attrY += 30;
        this.createAttributeLine(attrX, attrY, 'Cooldown Ataque:', (this.playerData.attackCooldown || this.classData.attackCooldown) + 'ms', labelStyle, valueStyle); attrY += 30;
        if (this.playerData.damageReduction) {
            this.createAttributeLine(attrX, attrY, 'Redução de Dano:', Math.round(this.playerData.damageReduction * 100) + '%', labelStyle, valueStyle); attrY += 30;
        }
        if (this.playerData.critChance) {
            this.createAttributeLine(attrX, attrY, 'Chance de Crítico:', Math.round(this.playerData.critChance * 100) + '%', labelStyle, valueStyle); attrY += 30;
        }
        const placeholderX = panelX + 50;
        const placeholderY = panelY - panelHeight / 2 + 80;
        const placeholderW = panelWidth / 2 - 80;
        const placeholderH = panelHeight - 120;
        this.createPlaceholderBox(placeholderX, placeholderY, placeholderW, placeholderH / 2 - 10, 'Equipamentos');
        this.createPlaceholderBox(placeholderX, placeholderY + placeholderH / 2 + 10, placeholderW, placeholderH / 2 - 10, 'Itens');
        const returnButton = this.add.text(panelX, panelY + panelHeight / 2 - 35, 'Voltar à Seleção', {
            fontSize: '20px', color: '#ffc107', fontStyle: 'bold', align: 'center',
            backgroundColor: '#333', padding: { top: 8, bottom: 8, left: 15, right: 15 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        returnButton.on('pointerdown', () => {
            this.scene.stop();
            this.scene.start('CharacterSelectScene');
        });
        this.input.keyboard.once('keydown-ESC', () => this.closeMenu());
    }
    createAttributeLine(x, y, label, value, labelStyle, valueStyle) {
        this.add.text(x, y, label, labelStyle).setOrigin(0, 0.5);
        this.add.text(x + 180, y, value, valueStyle).setOrigin(0, 0.5);
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
