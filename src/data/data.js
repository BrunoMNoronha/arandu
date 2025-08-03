// data.js
// Exporta dados globais do jogo: GameData e WaveConfig
// Dependências: nenhuma

// --- DADOS E CONFIGURAÇÕES GLOBAIS ---
export const GameData = {
    Classes: {
        CACADOR: {
            id: 'CACADOR', nome: 'Caçador das Sombras', desc: 'Mestre do arco e das armadilhas furtivas.', cor: 0x8e44ad,
            velocidade: 230, vida: 90, dano: 22, attackType: 'ranged', attackCooldown: 350,
            critChance: 0.15, critMultiplier: 1.5,
            baseAttributes: { FOR: 5, AGI: 8, VIT: 6, INT: 4, DES: 10, SOR: 6 },
            growth: { FOR: 2, AGI: 3, VIT: 2, INT: 1, DES: 3, SOR: 2 },
            ability: { name: 'Chuva de Flechas', cooldown: 12000, damageMultiplier: 0.5, waves: 4, duration: 2000, radius: 120, icon: 'arrow-rain-icon' }
        },
        GUERREIRO: {
            id: 'GUERREIRO', nome: 'Guerreiro de Ossos', desc: 'A força bruta da floresta, inabalável.', cor: 0xc0392b,
            velocidade: 170, vida: 180, dano: 25, attackType: 'melee', attackRange: 80, attackCooldown: 400,
            damageReduction: 0.15,
            baseAttributes: { FOR: 10, AGI: 5, VIT: 9, INT: 3, DES: 5, SOR: 4 },
            growth: { FOR: 3, AGI: 2, VIT: 3, INT: 1, DES: 1, SOR: 1 },
            ability: { name: 'Impacto Sísmico', cooldown: 15000, damageMultiplier: 1, stunDuration: 2000, radius: 150, icon: 'shockwave-icon' }
        }
    },
    Enemies: {
        TATU_ZUMBI: { id: 'TATU_ZUMBI', nome: 'Tatu Zumbi', texture: 'enemy-texture', cor: 0x7f8c8d, velocidade: 60, vida: 80, dano: 10, xp: 50, ai: 'melee', cost: 1 },
        ARANHA_DE_DARDO: { id: 'ARANHA_DE_DARDO', nome: 'Aranha de Dardo', texture: 'enemy-spider-texture', cor: 0x3498db, velocidade: 80, vida: 60, dano: 15, xp: 75, ai: 'ranged', attackDelay: 2000, attackRange: 350, cost: 2 },
        BOSS_JIBOIA: { id: 'BOSS_JIBOIA', nome: 'Jiboia Ancestral', texture: 'boss-jiboia-texture', cor: 0x229954, velocidade: 50, vida: 800, dano: 40, xp: 500, ai: 'melee', boss: true }
    }
};

export const WaveConfig = {
    definitions: [
        { TATU_ZUMBI: 5 },
        { TATU_ZUMBI: 8 },
        { TATU_ZUMBI: 5, ARANHA_DE_DARDO: 3 },
        { ARANHA_DE_DARDO: 7 },
        { TATU_ZUMBI: 8, ARANHA_DE_DARDO: 4, BOSS_JIBOIA: 1 },
        { TATU_ZUMBI: 8, ARANHA_DE_DARDO: 6 },
        { ARANHA_DE_DARDO: 10 },
        { TATU_ZUMBI: 15, ARANHA_DE_DARDO: 5 },
        { ARANHA_DE_DARDO: 15 },
        { TATU_ZUMBI: 10, ARANHA_DE_DARDO: 10 }
    ],
    spawnInterval: 350, initialWaveDelay: 1000, betweenWavesDelay: 5000, proceduralBasePoints: 12, proceduralPointGrowth: 3
};
