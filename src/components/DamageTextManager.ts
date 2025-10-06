import Phaser, { Scene, Physics } from 'phaser';

type DamageTextStyle = {
    readonly fill: string;
    readonly stroke: string;
};

/**
 * Gera textos flutuantes para comunicar dano diretamente na cena.
 * Utiliza pooling para evitar alocações excessivas em cenários com muitos acertos.
 */
export class DamageTextManager {
    private readonly scene: Scene;
    private readonly pool: Phaser.GameObjects.Group;
    private readonly styles: Record<'player' | 'enemy', DamageTextStyle>;

    constructor(scene: Scene) {
        this.scene = scene;
        this.pool = this.scene.add.group({ classType: Phaser.GameObjects.Text });
        this.styles = {
            player: { fill: '#ffe066', stroke: '#2f2f2f' },
            enemy: { fill: '#ff6b6b', stroke: '#1f1f1f' },
        };
    }

    public showDamage(target: Physics.Arcade.Sprite, amount: number, type: 'player' | 'enemy'): void {
        const text = this.acquireText();
        const style = this.styles[type];

        text.setText(Math.round(amount).toString());
        text.setPosition(target.x, target.y - target.displayHeight * 0.75);
        text.setOrigin(0.5, 1);
        text.setDepth(1000);
        text.setStyle({
            fontFamily: 'Press Start 2P, monospace',
            fontSize: '12px',
            color: style.fill,
            stroke: style.stroke,
            strokeThickness: 4,
        });
        text.setAlpha(1);

        this.scene.tweens.add({
            targets: text,
            y: text.y - 16,
            alpha: 0,
            duration: 400,
            ease: Phaser.Math.Easing.Cubic.Out,
            onComplete: () => {
                this.releaseText(text);
            },
        });
    }

    private acquireText(): Phaser.GameObjects.Text {
        const existing = this.pool.getFirstDead(false) as Phaser.GameObjects.Text | null;
        if (existing) {
            existing.setActive(true);
            existing.setVisible(true);
            return existing;
        }

        const created = this.scene.add.text(0, 0, '');
        created.setPadding(2, 2, 2, 2);
        this.pool.add(created);
        return created;
    }

    private releaseText(text: Phaser.GameObjects.Text): void {
        this.pool.killAndHide(text);
        text.setActive(false);
        text.setVisible(false);
    }
}
