// waveConfig.js - Configuração das ondas de inimigos
export const WaveConfig = {
    definitions: [
        { TATU_ZUMBI: 5 },
        { TATU_ZUMBI: 8 },
        { TATU_ZUMBI: 5, ARANHA_DE_DARDO: 3 },
        { ARANHA_DE_DARDO: 7 },
        { TATU_ZUMBI: 8, ARANHA_DE_DARDO: 4, BOSS_JIBOIA: 1 }, // Quinta wave com boss
        { TATU_ZUMBI: 8, ARANHA_DE_DARDO: 6 },
        { ARANHA_DE_DARDO: 10 },
        { TATU_ZUMBI: 15, ARANHA_DE_DARDO: 5 },
        { ARANHA_DE_DARDO: 15 },
        { TATU_ZUMBI: 10, ARANHA_DE_DARDO: 10 }
    ],
    spawnInterval: 350,
    initialWaveDelay: 1000,
    betweenWavesDelay: 5000,
    proceduralBasePoints: 12,
    proceduralPointGrowth: 3
};
