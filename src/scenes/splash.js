// splash.js
// Cena de SplashScreen do jogo
// Dependências: Phaser

// splash.js
// Cena de SplashScreen do jogo
// Dependências: Phaser

export default class SplashScreenScene extends Phaser.Scene {
    constructor() { super('SplashScreenScene'); }
    preload() {
        const treeGfx = this.make.graphics({ add: false });
        treeGfx.fillStyle(0x5D4037, 1).fillRect(110, 200, 80, 150);
        treeGfx.fillStyle(0x388E3C, 1).fillCircle(150, 150, 100).fillCircle(90, 180, 70).fillCircle(210, 180, 70);
        treeGfx.generateTexture('title-image', 300, 350).destroy();
    }
    create() {
        this.cameras.main.setBackgroundColor('#1a1a1a');
        const { width, height } = this.scale;
        const isMobile = this.sys.game.device.os.android || this.sys.game.device.os.iOS;
        const titleFont = isMobile ? '32px' : '52px';
        const devFont = isMobile ? '16px' : '22px';
        const pressFont = isMobile ? '20px' : '28px';
        const pressMsg = isMobile ? 'Toque para jogar' : 'Toque para continuar';
        this.add.text(width/2, height * 0.2, 'Contos de Arandú', { fontSize: titleFont, color: '#00ff7f', fontFamily:'Georgia, serif', stroke:'#000', strokeThickness:8 }).setOrigin(0.5).setWordWrapWidth(width * 0.9);
        this.add.image(width/2, height/2, 'title-image').setAlpha(0.8);
        this.add.text(width/2, height - 80, 'Desenvolvido por Bruno Menezes', { fontSize: devFont, color:'#ccc', fontStyle:'italic' }).setOrigin(0.5);
        const pressText = this.add.text(width/2, height - 30, pressMsg, { fontSize: pressFont, color:'#fff' }).setOrigin(0.5).setAlpha(0);
        this.tweens.add({ targets: pressText, alpha:1, duration:1000, ease:'Power1', yoyo:true, repeat:-1, delay:1000 });
        this.input.once('pointerdown', ()=> {
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, ()=> this.scene.start('CharacterSelectScene'));
        });
    }
}
