import Phaser from 'phaser';

export interface HudLayoutMetrics {
    readonly fontScale: number;
    readonly trackHeight: number;
    readonly maxWidth: number;
}

export class HudLayoutAdapter {
    private readonly baseSize: Phaser.Structs.Size;
    private readonly epsilon: number;

    public constructor(baseSize: Phaser.Structs.Size = new Phaser.Structs.Size(1280, 720), epsilon: number = 0.001) {
        this.baseSize = baseSize;
        this.epsilon = epsilon;
    }

    public calculateMetrics(displaySize: Phaser.Structs.Size): HudLayoutMetrics {
        const widthRatio: number = displaySize.width / this.baseSize.width;
        const heightRatio: number = displaySize.height / this.baseSize.height;
        const fontScale: number = Phaser.Math.Clamp(Math.min(widthRatio, heightRatio), 0.75, 1.2);
        const trackHeight: number = Phaser.Math.Clamp(12 * fontScale, 8, 18);
        const availableWidth: number = Math.max(displaySize.width - 24, 280);
        const maxWidth: number = Math.min(520 * fontScale, availableWidth);

        return { fontScale, trackHeight, maxWidth };
    }

    public hasSignificantChange(current: HudLayoutMetrics | undefined, next: HudLayoutMetrics): boolean {
        if (!current) {
            return true;
        }

        return (
            this.hasDifference(current.fontScale, next.fontScale) ||
            this.hasDifference(current.trackHeight, next.trackHeight) ||
            this.hasDifference(current.maxWidth, next.maxWidth)
        );
    }

    public hasDifference(a: number, b: number): boolean {
        return Math.abs(a - b) > this.epsilon;
    }
}
