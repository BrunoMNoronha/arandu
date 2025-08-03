// character-select.js
// Cena de seleção de personagem
// Dependências: Phaser, GameData

// character-select.js
// Cena de seleção de personagem
// Dependências: Phaser, GameData

import { GameData } from '../data/data.js';

export default class CharacterSelectScene extends Phaser.Scene {
    constructor() { super('CharacterSelectScene'); }
    create() {
        this.cameras.main.fadeIn(500, 0, 0, 0);
        this.cameras.main.setBackgroundColor('#1a1a1a');
        const { width, height } = this.scale;
        const isMobile = this.sys.game.device.os.android || this.sys.game.device.os.iOS;
        const selectFont = isMobile ? '28px' : '48px';
        const selectMsg = isMobile ? 'Escolha seu herói' : 'Escolha seu Destino';
        this.add.text(width/2, height * 0.15, selectMsg, { fontSize: selectFont, color:'#00ff7f', fontFamily:'Georgia, serif', stroke:'#000', strokeThickness:6 }).setOrigin(0.5).setWordWrapWidth(width * 0.9);
        this.createClassButton(width/2, height * 0.4, GameData.Classes.CACADOR);
        this.createClassButton(width/2, height * 0.65, GameData.Classes.GUERREIRO);
    }
    createClassButton(x,y,classData) {
        const w = this.scale.width * 0.8;
        const h = 120;
        const btn = this.add.container(x, y);
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.5).fillRoundedRect(-w/2, -h/2, w, h, 16);
        bg.lineStyle(3, classData.cor, 0.8).strokeRoundedRect(-w/2, -h/2, w, h, 16);
        const title = this.add.text(-w/2+30, -h/2 + 25, classData.nome, {fontSize:'32px',color:'#fff',fontStyle:'bold'});
        const desc = this.add.text(-w/2+30, -h/2 + 65, classData.desc, {fontSize:'20px',color:'#ccc', wordWrap: { width: w - 60 }});
        btn.add([bg, title, desc]).setSize(w, h).setInteractive({useHandCursor:true});
        btn.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x000000, 0.5).fillRoundedRect(-w/2, -h/2, w, h, 16);
            bg.lineStyle(8, classData.cor, 1).strokeRoundedRect(-w/2, -h/2, w, h, 16);
        })
        .on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x000000, 0.5).fillRoundedRect(-w/2, -h/2, w, h, 16);
            bg.lineStyle(3, classData.cor, 0.8).strokeRoundedRect(-w/2, -h/2, w, h, 16);
            btn.setScale(1);
        })
        .on('pointerdown', () => btn.setScale(0.98))
        .on('pointerup', () => {
            btn.setScale(1);
            this.scene.start('DungeonScene', {selectedClass: classData});
        });
    }
}
