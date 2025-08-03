// Funções utilitárias de ataque e XP
export function fireAttack(scene, direction) {
    // Lógica robusta para determinar a direção do ataque
    let attackDir = new Phaser.Math.Vector2(); // Começa com um vetor vazio para garantir o tipo

    // Prioridade 1: Usar a direção explícita (joystick/teclado) se estiver ativa
    if (direction && (direction.x !== 0 || direction.y !== 0)) {
        attackDir.set(direction.x, direction.y).normalize();
    } 
    // Prioridade 2: Se não, usar a velocidade atual do jogador
    else {
        const vel = scene.player.body.velocity;
        if (vel.length() > 0) {
            attackDir.set(vel.x, vel.y).normalize();
        } 
        // Prioridade 3: Como último recurso, usar uma direção padrão (para cima)
        else {
            attackDir.set(0, -1);
        }
    }
    const cooldown = scene.player.getData('attackCooldown');
    const lastAttack = scene.player.getData('lastAttack');
    if (scene.time.now < lastAttack + cooldown) return;
    scene.player.setData('lastAttack', scene.time.now);

    if (scene.selectedClass.attackType === 'melee') {
        const range = scene.selectedClass.attackRange;
        const angle = attackDir.angle();
        const coneAngle = Phaser.Math.DegToRad(90); // Abertura do cone de 90 graus

        // Vértices do cone
        const p1 = { x: scene.player.x, y: scene.player.y };
        const p2 = { 
            x: scene.player.x + range * Math.cos(angle - coneAngle / 2),
            y: scene.player.y + range * Math.sin(angle - coneAngle / 2)
        };
        const p3 = { 
            x: scene.player.x + range * Math.cos(angle + coneAngle / 2),
            y: scene.player.y + range * Math.sin(angle + coneAngle / 2)
        };

        const attackCone = new Phaser.Geom.Polygon([
            p1.x, p1.y,
            p2.x, p2.y,
            p3.x, p3.y
        ]);

        // Efeito visual do cone
        const graphics = scene.add.graphics();
        graphics.lineStyle(2, 0xffffff, 0.8);
        graphics.strokePoints(attackCone.points, true);
        scene.tweens.add({
            targets: graphics,
            alpha: 0,
            duration: 250,
            onComplete: () => graphics.destroy()
        });

        let closestEnemy = null;
        let minDistance = Infinity;

        scene.enemies.getChildren().forEach(enemy => {
            if (enemy.active && Phaser.Geom.Polygon.Contains(attackCone, enemy.x, enemy.y)) {
                const distance = Phaser.Math.Distance.Between(scene.player.x, scene.player.y, enemy.x, enemy.y);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestEnemy = enemy;
                }
            }
        });

        if (closestEnemy) {
            let finalDamage = scene.player.getData('damage');
            let isCrit = false;
            if (Math.random() < scene.selectedClass.critChance) {
                finalDamage *= scene.selectedClass.critMultiplier;
                isCrit = true;
            }
            console.log('[fireAttack] Guerreiro acertou inimigo:', closestEnemy.name || closestEnemy.id, 'Dano:', finalDamage, 'Crítico:', isCrit);
            const isDefeated = closestEnemy.takeDamage(finalDamage, isCrit);
            if (isDefeated) {
                defeatTarget(scene, closestEnemy);
            }
        }
    } else {
        const proj = scene.playerAttacks.get(scene.player.x, scene.player.y);
        if (!proj) return;
        let finalDamage = scene.player.getData('damage'); // Usar o dano atual do jogador
        let isCrit = false;
        if (Math.random() < scene.selectedClass.critChance) {
            finalDamage *= scene.selectedClass.critMultiplier;
            isCrit = true;
        }
        proj.setData({ damage: finalDamage, isCrit: isCrit });
        proj.enableBody(true, scene.player.x, scene.player.y, true, true);
        proj.setVelocity(attackDir.x * 400, attackDir.y * 400);
    }
}

export function enemyFireAttack(scene, enemy) {
    const proj = scene.enemyAttacks.get(enemy.x, enemy.y);
    if (!proj) return;
    const damage = enemy.stats.dano;
    proj.setData('damage', damage);
    proj.enableBody(true, enemy.x, enemy.y, true, true);
    const dir = new Phaser.Math.Vector2(scene.player.x - enemy.x, scene.player.y - enemy.y).normalize();
    proj.setVelocity(dir.x * 300, dir.y * 300);
}

export function projectileHitEnemy(scene, proj, enemy) {
    if (enemy.active) {
        const damage = proj.getData('damage') || 0;
        const isCrit = proj.getData('isCrit') || false;
        const isDefeated = enemy.takeDamage(damage, isCrit);
        if (isDefeated) {
            defeatTarget(scene, enemy);
        }
    }
    proj.disableBody(true, true);
}

export function projectileHitPlayer(scene, player, proj) {
    damagePlayer(scene, proj.getData('damage') || 0);
    proj.disableBody(true, true);
}

export function playerHitEnemy(scene, player, enemy) {
    if (enemy.active && !scene.player.getData('isInvulnerable')) {
        damagePlayer(scene, enemy.stats.dano);
    }
}

export function damagePlayer(scene, amount) {
    if (scene.player.getData('isInvulnerable')) return;
    let finalDamage = amount;
    if (scene.selectedClass.damageReduction) {
        finalDamage *= (1 - scene.selectedClass.damageReduction);
    }
    scene.cameras.main.shake(150, 0.005);
    const newHp = scene.player.getData('hp') - finalDamage;
    scene.player.setData('hp', newHp);
    scene.showFloatingText(Math.round(finalDamage), scene.player.x, scene.player.y);
    scene.updatePlayerHud();
    if (newHp <= 0) {
        defeatTarget(scene, scene.player);
    }
    scene.player.setData('isInvulnerable', true);
    scene.tweens.add({
        targets: scene.player,
        alpha: 0.5,
        duration: 100,
        ease: 'Power1',
        yoyo: true,
        repeat: 7,
        onComplete: () => {
            scene.player.setAlpha(1);
            scene.player.setData('isInvulnerable', false);
        }
    });
}

export function defeatTarget(scene, target) {
    if (target === scene.player) {
        if (scene.gameOverText) return; // Previne execuções múltiplas
        scene.player.disableBody(true, true);
        if (scene.weaponSprite) scene.weaponSprite.setVisible(false);

        const isMobile = scene.sys.game.device.os.android || scene.sys.game.device.os.iOS;
        const gameOverFont = isMobile ? '42px' : '56px';
        const gameOverMsg = 'FIM DE JOGO';
        
        scene.gameOverText = scene.add.text(scene.scale.width / 2, scene.scale.height / 2, gameOverMsg, { fontSize: gameOverFont, color: '#ff3333', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5).setDepth(40);
        scene.tweens.add({ targets: scene.gameOverText, scale: 1.1, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        
        const restartButton = scene.add.text(scene.scale.width / 2, scene.scale.height / 2 + 80, 'Reiniciar', { fontSize: '32px', color: '#00ff7f', backgroundColor: '#222', padding: { top: 10, bottom: 10, left: 20, right: 20 } }).setOrigin(0.5).setDepth(41).setInteractive({ useHandCursor: true });
        
        // Pausar a cena DEPOIS de criar o botão, mas registrar o evento para ignorar a pausa.
        scene.scene.pause();

        restartButton.on('pointerdown', () => {
            // Limpar o estado antes de reiniciar
            if (scene.gameOverText) scene.gameOverText.destroy();
            scene.gameOverText = null;
            scene.scene.restart({ selectedClass: scene.selectedClass });
        });

        // Habilitar o input para este objeto mesmo com a cena pausada
        scene.input.enable(restartButton);

    } else {
        console.log('[defeatTarget] Inimigo derrotado:', target.name || target.id);
        target.die();
        scene.enemiesRemaining--;
        scene.updateWaveProgressText();
        scene.checkWaveCompletion();
    }
}

export function gainXP(scene, amount) {
    scene.player.gainXP(amount);
    scene.showFloatingText(`+${amount} XP`, scene.player.x, scene.player.y - 40, false, '#00ff7f');
}
