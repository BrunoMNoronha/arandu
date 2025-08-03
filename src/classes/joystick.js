// joystick.js
// Classe Joystick para controle do jogador
// Dependências: Phaser

// --- Classe Joystick ---
// Controla o movimento do jogador e ataques via joystick virtual
// Dependências: Phaser

export default class Joystick {
    constructor(scene, isAttackJoystick = false) {
        this.scene = scene;
        this.isAttackJoystick = isAttackJoystick;
        this.base = scene.add.circle(0, 0, 70, 0x000000, 0.3).setDepth(10).setVisible(false);
        this.thumb = scene.add.circle(0, 0, 35, 0xffffff, 0.4).setDepth(10).setVisible(false);
        this.vector = new Phaser.Math.Vector2(0, 0);
        this.fireDirection = new Phaser.Math.Vector2(0, -1);
        this.pointer = null;
    }
    activate(pointer) {
        this.pointer = pointer;
        this.base.setPosition(pointer.x, pointer.y).setVisible(true);
        this.thumb.setPosition(pointer.x, pointer.y).setVisible(true);
    }
    deactivate() {
        if (this.isAttackJoystick) {
            if (this.scene.joystickAttackInterval) {
                this.scene.joystickAttackInterval.remove();
                this.scene.joystickAttackInterval = null;
            }
            if (this.scene.player.active) {
                this.scene.fireAttack(this.fireDirection);
            }
        }
        this.pointer = null;
        this.vector.set(0, 0);
        this.base.setVisible(false);
        this.thumb.setVisible(false);
    }
    update() {
        if (!this.pointer) return;
        const angle = Phaser.Math.Angle.Between(this.base.x, this.base.y, this.pointer.x, this.pointer.y);
        const dist = Math.min(this.base.radius, Phaser.Math.Distance.Between(this.base.x, this.base.y, this.pointer.x, this.pointer.y));
        this.thumb.x = this.base.x + dist * Math.cos(angle);
        this.thumb.y = this.base.y + dist * Math.sin(angle);
        this.vector.set(this.thumb.x - this.base.x, this.thumb.y - this.base.y);
        if (this.vector.length() > 0) {
            this.vector.normalize();
            this.fireDirection.copy(this.vector);
        }
    }
}
