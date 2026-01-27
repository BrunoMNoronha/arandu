export type ResourceKind = 'level' | 'health' | 'mana' | 'experience';

export interface HudResource {
    setValue(current: number, max: number, displayText?: string): void;
    setLevel(level: number, displayText?: string): void;
}

export class BasicHudResource implements HudResource {
    private readonly valueElement: HTMLElement;
    private readonly fillElement?: HTMLElement;
    private readonly extraElements: readonly HTMLElement[];

    private lastCurrent: number | null = null;
    private lastMax: number | null = null;
    private lastRenderedText: string | null = null;

    public constructor(valueElement: HTMLElement, fillElement?: HTMLElement, extraElements: readonly HTMLElement[] = []) {
        this.valueElement = valueElement;
        this.fillElement = fillElement;
        this.extraElements = extraElements;
    }

    public setValue(current: number, max: number, displayText?: string): void {
        const text = displayText ?? `${current}/${max}`;
        if (this.lastRenderedText !== text) {
            this.valueElement.textContent = text;
            this.lastRenderedText = text;
        }

        if (this.lastCurrent !== current || this.lastMax !== max) {
            const safeMax = Math.max(max, 0);
            const percentage = safeMax > 0 ? Math.min(Math.max(current / safeMax, 0), 1) : 0;

            if (this.fillElement) {
                this.fillElement.style.width = `${percentage * 100}%`;
                this.fillElement.setAttribute('aria-valuemin', '0');
                this.fillElement.setAttribute('aria-valuenow', current.toString());
                this.fillElement.setAttribute('aria-valuemax', safeMax.toString());
            }
            this.lastCurrent = current;
            this.lastMax = max;
        }
    }

    public setLevel(level: number, displayText?: string): void {
        this.valueElement.textContent = displayText ?? level.toString();
        for (const element of this.extraElements) {
            element.setAttribute('data-level', level.toString());
        }
    }

    public reset(): void {
        this.valueElement.textContent = '';
        this.lastRenderedText = '';

        if (this.fillElement) {
            this.fillElement.style.width = '0%';
            this.fillElement.setAttribute('aria-valuemin', '0');
            this.fillElement.setAttribute('aria-valuenow', '0');
            this.fillElement.setAttribute('aria-valuemax', '0');
        }
        this.lastCurrent = null;
        this.lastMax = null;

        for (const element of this.extraElements) {
            element.removeAttribute('data-level');
        }
    }
}
