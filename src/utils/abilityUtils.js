export function useArrowRain(scene, targetPos) {
    const ability = scene.selectedClass.ability;
    for (let i = 0; i < ability.waves; i++) {
        scene.time.delayedCall(i * 300, () => {
            for (let a = 0; a < 8; a++) {
                const angle = Phaser.Math.DegToRad(45 * a);
                const proj = scene.playerAttacks.get(targetPos.x, targetPos.y, 'player-projectile-texture');
                if (proj) {
                    proj.enableBody(true, targetPos.x, targetPos.y, true, true);
                    proj.setActive(true).setVisible(true);
                    proj.setData('damage', scene.player.getData('damage') * ability.damageMultiplier);
                    scene.physics.velocityFromRotation(angle, 350, proj.body.velocity);
                }
            }
        });
    }
    scene.showFloatingText('Chuva de Flechas!', targetPos.x, targetPos.y, true, '#00ff00');
}

export function useShockwave(scene, targetPos) {
    const ability = scene.selectedClass.ability;
    scene.showFloatingText('Impacto Sísmico!', targetPos.x, targetPos.y, true, '#00ff00');
    scene.enemies.children.iterate(enemy => {
        if (enemy && enemy.active) {
            const dist = Phaser.Math.Distance.Between(targetPos.x, targetPos.y, enemy.x, enemy.y);
            if (dist < ability.radius) {
                enemy.takeDamage(scene.player.getData('damage') * ability.damageMultiplier);
                enemy.setData('isStunned', true);
                scene.time.delayedCall(ability.stunDuration, () => {
                    enemy.setData('isStunned', false);
                });
            }
        }
    });
}
