import { Scene } from 'phaser';

export class Preloader extends Scene {
    constructor() {
        super('Preloader');
    }

    preload() {
        // Define o caminho base para os assets para facilitar o carregamento
        this.load.setBaseURL('assets/');

        // Carrega os assets de imagem
        this.load.image('player', 'player.png');
        this.load.image('enemy', 'enemy.png');
    }

    create() {
        // Quando o carregamento estiver completo, inicia a cena principal do jogo
        this.scene.start('DungeonScene');
    }
}