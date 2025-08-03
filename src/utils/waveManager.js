import { GameData, WaveConfig } from '../data/data.js';

export default class WaveManager {
    constructor(scene) {
        this.scene = scene;
    }

    setupWaveSystem() {
        const scene = this.scene;
        scene.currentWave = 0;
        scene.waveState = 'BETWEEN_WAVES';
        const textStyle = { fontSize: '48px', color: '#ffffff', stroke: '#000000', strokeThickness: 6, align: 'center' };
        scene.waveInfoText = scene.add.text(scene.scale.width/2, scene.scale.height/2 - 50, '', textStyle).setOrigin(0.5).setDepth(30);
        scene.waveCountdownText = scene.add.text(scene.scale.width/2, scene.scale.height/2 + 20, '', textStyle).setOrigin(0.5).setDepth(30);
        scene.time.delayedCall(WaveConfig.initialWaveDelay || 1000, this.startNextWave, [], this);
    }

    startNextWave() {
        const scene = this.scene;
        scene.currentWave++;
        scene.waveState = 'IN_WAVE';
        scene.waveInfoText.setText(`Onda ${scene.currentWave}`).setVisible(true);
        scene.waveCountdownText.setVisible(false);
        scene.time.delayedCall(2000, () => scene.waveInfoText.setVisible(false));
        const waveDef = WaveConfig.definitions[scene.currentWave - 1] || this.generateProceduralWave();
        this.spawnWave(waveDef);
    }

    spawnWave(waveDef) {
        const scene = this.scene;
        scene.enemiesRemaining = Object.values(waveDef).reduce((a, b) => a + b, 0);
        Object.entries(waveDef).forEach(([enemyId, count]) => {
            for (let i = 0; i < count; i++) {
                scene.time.delayedCall(i * (WaveConfig.spawnInterval || 350), () => {
                    scene.spawnEnemy(GameData.Enemies[enemyId]);
                });
            }
        });
    }

    generateProceduralWave() {
        const scene = this.scene;
        const proceduralPoints = WaveConfig.proceduralBasePoints + (scene.currentWave - WaveConfig.definitions.length) * WaveConfig.proceduralPointGrowth;
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

    checkWaveCompletion() {
        const scene = this.scene;
        if (scene.waveState === 'IN_WAVE' && scene.enemies.countActive(true) === 0) {
            this.endWave();
        }
    }

    endWave() {
        const scene = this.scene;
        scene.waveState = 'BETWEEN_WAVES';
        scene.waveInfoText.setText('Onda Concluída!').setVisible(true);
        scene.waveProgressText.setVisible(false);
        let countdown = (WaveConfig.betweenWavesDelay || 5000) / 1000;
        scene.waveCountdownText.setText(`Próxima onda em ${countdown}...`).setVisible(true);
        scene.time.addEvent({ delay: 1000, repeat: countdown - 1, callback: () => {
            countdown--;
            scene.waveCountdownText.setText(`Próxima onda em ${countdown}...`);
        }});
        scene.time.delayedCall(WaveConfig.betweenWavesDelay || 5000, this.startNextWave, [], this);
    }
}

