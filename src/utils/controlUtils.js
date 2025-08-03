// Funções utilitárias de controle
import { fireAttack } from './attackUtils.js';

export function handleControls(scene) {
    const speed = scene.selectedClass.velocidade;
    scene.player.body.setVelocity(0);
    if (scene.cursors.left.isDown) scene.player.body.setVelocityX(-speed);
    else if (scene.cursors.right.isDown) scene.player.body.setVelocityX(speed);
    if (scene.cursors.up.isDown) scene.player.body.setVelocityY(-speed);
    else if (scene.cursors.down.isDown) scene.player.body.setVelocityY(speed);
    handleTouch(scene);
    scene.moveJoystick.update();
    scene.attackJoystick.update();
    if (scene.moveJoystick.pointer) {
        scene.player.body.setVelocity(scene.moveJoystick.vector.x * speed, scene.moveJoystick.vector.y * speed);
    }
    if (scene.player.body.velocity.length() > speed) {
        scene.player.body.velocity.normalize().scale(speed);
    }
}

export function startJoystickAutoAttack(scene) {
    if (!scene.joystickAttackInterval) {
        let dir = scene.attackJoystick.fireDirection || new Phaser.Math.Vector2(0, -1);
        fireAttack(scene, dir);
        scene.joystickAttackInterval = scene.time.addEvent({
            delay: scene.selectedClass.attackCooldown,
            loop: true,
            callback: () => {
                let dir = scene.attackJoystick.fireDirection || new Phaser.Math.Vector2(0, -1);
                fireAttack(scene, dir);
            }
        });
    }
}

export function handleTouch(scene) {
    for (const ptr of scene.input.manager.pointers) {
        if (ptr.isDown) {
            if (scene.moveJoystick.pointer === ptr || scene.attackJoystick.pointer === ptr) continue;
            let isMoveZone, isAttackZone;
            const { width, height } = scene.scale;
            if (scene.isLandscape) {
                isMoveZone = ptr.x < width / 2 && ptr.y > height / 2;
                isAttackZone = ptr.x > width / 2 && ptr.y > height / 2;
            } else {
                isMoveZone = ptr.x < width / 2;
                isAttackZone = ptr.x > width / 2;
            }
            if (isMoveZone && !scene.moveJoystick.pointer) {
                scene.moveJoystick.activate(ptr);
            } else if (isAttackZone && !scene.attackJoystick.pointer) {
                scene.attackJoystick.activate(ptr);
                startJoystickAutoAttack(scene);
            }
        } else {
            if (scene.moveJoystick.pointer === ptr) scene.moveJoystick.deactivate();
            if (scene.attackJoystick.pointer === ptr) scene.attackJoystick.deactivate();
        }
    }
}
