import { Scene } from 'phaser';

export class Preloader extends Scene {
    constructor() {
        super('Preloader');
    }

    preload() {
        // O Vite move os assets da pasta 'public' para a raiz do servidor.
        // Portanto, o caminho base já é o correto.
        this.load.image('player', 'assets/player.png');
        this.load.image('enemy', 'assets/enemy.png');
    }

    create() {
        // Quando o carregamento estiver completo, inicia a cena principal do jogo.
        this.scene.start('DungeonScene');
    }
}