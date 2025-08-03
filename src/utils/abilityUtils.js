export function useArrowRain(scene, targetPos) {
    const ability = scene.selectedClass.ability;
    const numProjectiles = ability.waves * 5; // Aumentando a densidade da chuva
    const radius = ability.radius;

    for (let i = 0; i < numProjectiles; i++) {
        scene.time.delayedCall(i * 50, () => {
            const offsetX = Phaser.Math.Between(-radius, radius);
            const offsetY = Phaser.Math.Between(-radius, radius);
            
            // Garante que o ponto esteja dentro do círculo
            const targetPoint = new Phaser.Math.Vector2(targetPos.x + offsetX, targetPos.y + offsetY);
            if (targetPoint.distance(targetPos) > radius) {
                targetPoint.subtract(targetPos).normalize().scale(radius).add(targetPos);
            }

            const startY = targetPoint.y - 400; // Começa bem acima
            const proj = scene.playerAttacks.get(targetPoint.x, startY, 'player-projectile-texture');

            if (proj) {
                proj.enableBody(true, targetPoint.x, startY, true, true);
                proj.setActive(true).setVisible(true);
                proj.setData('damage', scene.player.getData('damage') * ability.damageMultiplier);
                proj.setData('isCrit', false); // Habilidades podem ou não critar, decidi que não por padrão
                proj.body.setGravityY(800); // Puxa o projétil para baixo
                proj.body.velocity.x = 0; // Sem movimento horizontal inicial
            }
        });
    }
    scene.showFloatingText('Chuva de Flechas!', targetPos.x, targetPos.y, false, '#00ff00');
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
