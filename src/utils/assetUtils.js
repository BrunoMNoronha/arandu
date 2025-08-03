// assetUtils.js
// Funções utilitárias para geração de gráficos e texturas do jogo
// Dependências: Phaser

export function generatePlayerTexture(scene, color) {
    const gfx = scene.make.graphics({ add: false });
    gfx.fillStyle(color, 1).fillCircle(20, 20, 16);
    gfx.lineStyle(2, 0xffffff, 0.8).strokeCircle(20, 20, 16);
    gfx.generateTexture('player-texture', 40, 40);
    gfx.destroy();
}

export function generateTatuZumbiTexture(scene, color) {
    const gfx = scene.make.graphics({ add: false });
    gfx.fillStyle(color, 1).fillEllipse(15, 18, 28, 22);
    gfx.fillStyle(0x444444, 1).fillEllipse(15, 18, 18, 12);
    gfx.fillStyle(0xff3333, 1).fillCircle(8, 14, 2).fillCircle(22, 14, 2);
    gfx.lineStyle(2, 0x222222).strokeEllipse(15, 18, 28, 22);
    gfx.generateTexture('enemy-texture', 30, 30);
    gfx.destroy();
}

export function generateAranhaDeDardoTexture(scene, color) {
    const gfx = scene.make.graphics({ add: false });
    gfx.fillStyle(color, 1).fillCircle(18, 20, 12);
    gfx.fillStyle(0x222222, 1).fillCircle(18, 10, 6);
    gfx.lineStyle(2, 0x222222);
    for (let i = 0; i < 8; i++) {
        const a = Math.PI / 4 * i;
        gfx.beginPath();
        gfx.moveTo(18, 20);
        gfx.lineTo(18 + 18 * Math.cos(a), 20 + 18 * Math.sin(a));
        gfx.strokePath();
    }
    gfx.fillStyle(0xffcc00, 1).fillTriangle(18, 32, 22, 36, 14, 36);
    gfx.fillStyle(0xffffff, 1).fillCircle(16, 8, 1.5).fillCircle(20, 8, 1.5);
    gfx.generateTexture('enemy-spider-texture', 36, 40);
    gfx.destroy();
}

export function generateBossJiboiaTexture(scene, color) {
    const gfx = scene.make.graphics({ add: false });
    gfx.fillStyle(color, 1);
    gfx.fillEllipse(40, 40, 70, 30);
    gfx.fillEllipse(90, 40, 30, 22);
    gfx.fillStyle(0x145a32, 1);
    for (let i = 0; i < 6; i++) {
        gfx.fillEllipse(30 + i * 10, 40, 12, 8);
    }
    gfx.fillStyle(0xff3333, 1).fillCircle(98, 36, 4).fillCircle(98, 44, 4);
    gfx.lineStyle(4, 0xffffff, 0.7).strokeEllipse(40, 40, 70, 30);
    gfx.generateTexture('boss-jiboia-texture', 120, 80);
    gfx.destroy();
}

export function generateWeaponTexture(scene, classId) {
    if (classId === 'CACADOR') {
        const gfx = scene.make.graphics({ add: false });
        gfx.fillStyle(0x333333, 1).fillRect(0, 0, 38, 8);
        gfx.fillStyle(0x228B22, 1).fillCircle(36, 4, 6);
        gfx.generateTexture('zarabatana', 40, 12);
        gfx.destroy();
    } else if (classId === 'GUERREIRO') {
        const gfx = scene.make.graphics({ add: false });
        gfx.fillStyle(0x8B4513, 1).fillRect(0, 4, 28, 6);
        gfx.fillStyle(0xcccccc, 1).fillRect(24, 0, 12, 14);
        gfx.fillStyle(0x888888, 1).fillRect(32, 2, 6, 10);
        gfx.generateTexture('machado', 40, 16);
        gfx.destroy();
    }
}

export function generateProjectileTextures(scene) {
    const prGfx = scene.make.graphics({ add: false });
    prGfx.fillStyle(0xffff00, 1).fillCircle(5, 5, 5);
    prGfx.generateTexture('player-projectile-texture', 10, 10);
    prGfx.destroy();

    const epGfx = scene.make.graphics({ add: false });
    epGfx.fillStyle(0x9b59b6, 1).fillTriangle(0, 0, 10, 0, 5, 10);
    epGfx.generateTexture('enemy-projectile-texture', 10, 10);
    epGfx.destroy();
}

export function generateIcons(scene) {
    const iconGfx = scene.make.graphics({ add: false });
    iconGfx.fillStyle(0xffffff, 1).fillCircle(20, 12, 10).fillCircle(20, 35, 18);
    iconGfx.generateTexture('profile-icon', 40, 40);
    iconGfx.destroy();

    const shockwaveIcon = scene.make.graphics({ add: false });
    shockwaveIcon.lineStyle(4, 0xffffff).beginPath().arc(25, 25, 10, 0, Math.PI * 2).strokePath().arc(25, 25, 20, 0, Math.PI * 2).strokePath();
    shockwaveIcon.generateTexture('shockwave-icon', 50, 50);
    shockwaveIcon.destroy();

    const arrowRainIcon = scene.make.graphics({ add: false });
    arrowRainIcon.fillStyle(0xffffff).fillTriangle(20, 10, 30, 10, 25, 20).fillTriangle(10, 25, 20, 25, 15, 35).fillTriangle(30, 25, 40, 25, 35, 35);
    arrowRainIcon.generateTexture('arrow-rain-icon', 50, 50);
    arrowRainIcon.destroy();
}
