import { Scene } from 'phaser';

export class UIScene extends Scene {
    private healthText!: Phaser.GameObjects.Text;

    constructor() {
        super('UIScene');
    }

    create() {
        // Exibe o texto inicial de vida no canto superior esquerdo.
        this.healthText = this.add.text(10, 10, 'Vida: 100', {
            fontSize: '16px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });

        // Escuta o evento global para atualizar a vida do jogador.
        this.game.events.on('player-health-changed', this.updateHealthText, this);
        
        // Garante que a cena seja limpa ao ser desligada para evitar listeners duplicados.
        this.events.on('shutdown', () => {
            this.game.events.off('player-health-changed', this.updateHealthText, this);
        });
    }

    private updateHealthText(health: number): void {
        this.healthText.setText(`Vida: ${health}`);
    }
}