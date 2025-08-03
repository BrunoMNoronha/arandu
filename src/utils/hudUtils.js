// Funções utilitárias de HUD
export function createHUD(scene) {
    scene.hudContainer = scene.add.container(20, 20).setDepth(20);
    scene.playerHudHpBar = scene.add.graphics();
    scene.playerHudXpBar = scene.add.graphics();
    scene.levelText = scene.add.text(10, 28, '', { fontSize:'20px', color:'#fff', stroke: '#000', strokeThickness: 4 });
    scene.hudContainer.add([scene.playerHudHpBar, scene.playerHudXpBar, scene.levelText]);
    scene.waveProgressText = scene.add.text(scene.scale.width - 20, 20, '', { fontSize:'22px', color:'#fff', stroke:'#000', strokeThickness:4, align: 'right' }).setOrigin(1, 0).setDepth(20);
    scene.profileButton = scene.add.image(scene.scale.width - 40, 40, 'profile-icon').setInteractive({ useHandCursor: true }).setDepth(21).setScale(0.8);
    scene.profileButton.on('pointerdown', () => {
        scene.scene.pause();
        scene.scene.launch('UIScene', { playerData: scene.player.data.getAll(), classData: scene.selectedClass });
    });
    // Botão de habilidade especial
    const abilityData = scene.selectedClass.ability;
    scene.specialAbilityButton = scene.add.image(0, 0, abilityData.icon).setInteractive({ useHandCursor: true }).setDepth(21).setScale(1.2);
    scene.specialAbilityButton.on('pointerdown', () => scene.tryUseSpecialAbility());
    scene.specialAbilityCooldownText = scene.add.text(0, 0, '', { fontSize: '24px', color: '#ffffff', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5).setDepth(22);
    updatePlayerHud(scene);
    repositionHUD(scene, scene.scale.width, scene.scale.height);
}

export function updatePlayerHud(scene) {
    const hp = Math.max(0, scene.player.getData('hp') / scene.player.getData('maxHp'));
    scene.playerHudHpBar.clear().fillStyle(0x000, 0.5).fillRoundedRect(0, 0, 204, 24, 5).fillStyle(0x00ff00).fillRoundedRect(2, 2, 200 * hp, 20, 4);
    const xp = scene.player.getData('xp') / scene.player.getData('xpToNextLevel');
    scene.playerHudXpBar.clear().fillStyle(0x000, 0.5).fillRoundedRect(0, 50, 204, 14, 5).fillStyle(0x8a2be2).fillRoundedRect(2, 52, 200 * xp, 10, 4);
    scene.levelText.setText(`Nível: ${scene.player.getData('level')}`);
}

export function updateWaveProgressText(scene) {
    if (scene.waveState === 'IN_WAVE') {
        scene.waveProgressText.setText(`Inimigos: ${scene.enemiesRemaining}`).setVisible(true);
    } else {
        scene.waveProgressText.setVisible(false);
    }
}

export function showFloatingText(scene, txt, x, y, isCrit = false, color = '#ffdddd') {
    let finalColor = isCrit ? '#ffff00' : color;
    let finalSize = isCrit ? '26px' : '20px';
    let finalText = isCrit ? `${String(txt)}!` : String(txt);
    const ft = scene.floatingTexts.get(x, y, finalText, { fontSize: finalSize, color: finalColor, stroke:'#000', strokeThickness:4, fontStyle: 'bold' });
    if (!ft) return;
    ft.setActive(true).setVisible(true).setOrigin(0.5).setDepth(20).setAlpha(1);
    scene.tweens.add({ targets: ft, y: y - 60, alpha: 0, duration: 1500, ease: 'Power1', onComplete: ()=> { ft.setActive(false).setVisible(false); } });
}

export function updateSpecialAbilityUI(scene) {
    if (!scene.specialAbilityButton) return;
    const now = scene.time.now;
    const lastUsed = scene.player.getData('lastSpecialAttack');
    const cooldown = scene.selectedClass.ability.cooldown;
    const timeElapsed = now - lastUsed;

    if (timeElapsed < cooldown) {
        const remaining = cooldown - timeElapsed;
        const remainingSeconds = Math.ceil(remaining / 1000);
        scene.specialAbilityCooldownText.setText(remainingSeconds);
        scene.specialAbilityButton.setAlpha(0.5);
        scene.specialAbilityButton.disableInteractive();
    } else {
        scene.specialAbilityCooldownText.setText('');
        scene.specialAbilityButton.setAlpha(1);
        scene.specialAbilityButton.setInteractive({ useHandCursor: true });
    }
}

export function repositionHUD(scene, width, height) {
    if (scene.hudContainer) scene.hudContainer.setPosition(20, 20);
    if (scene.waveProgressText) scene.waveProgressText.setPosition(width - 20, 20);
    if (scene.profileButton) scene.profileButton.setPosition(width - 40, 40);
    if (scene.specialAbilityButton) {
        const yPos = scene.attackJoystick.base.y || height - 80;
        scene.specialAbilityButton.setPosition(width - 80, yPos - 80);
        scene.specialAbilityCooldownText.setPosition(scene.specialAbilityButton.x, scene.specialAbilityButton.y);
    }
    if (scene.waveInfoText) scene.waveInfoText.setPosition(width / 2, height / 2 - 50);
    if (scene.waveCountdownText) scene.waveCountdownText.setPosition(width / 2, height / 2 + 20);
    if (scene.gameOverText) scene.gameOverText.setPosition(width / 2, height / 2);
}
