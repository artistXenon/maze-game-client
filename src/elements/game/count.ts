import { Sprite } from "artistic-engine/sprite";
import { getEngine } from "../../engine";

export default class CountSprite extends Sprite {
    private static frame_unit = 1000;

    private counting: boolean = false;

    private countTo: number = 0;

    private font: string;

    constructor() {
        super({ X: 900, Y: 500 });
        this.font = getEngine().getFontBuilder("GowunBatang")!.setSize(`50px`).toString();
    }

    public get Time() {
        return this.countTo - performance.now();
    }

    onDraw(context: CanvasRenderingContext2D, delay: number): void {
        // TODO: pretty~
        if (!this.counting) return;
        const diff = this.Time;
        const currentFrame = 
            diff > CountSprite.frame_unit * 3 ? `Ready` :
            diff > CountSprite.frame_unit * 2 ? `3` :
            diff > CountSprite.frame_unit * 1 ? `2` :
            diff > 0 ? `1` : `GO`;
        context.fillStyle = `white`;
        // TODO: 
        context.font = this.font;
        context.fillText(currentFrame, 0, 0);
        if (currentFrame === `GO`) {
            setTimeout(() => {
                // this.setParent(null);
                this.counting = false;
            }, 1000);
        }
    }

    public count(time: number) {
        if (this.Parent == null) return;
        this.countTo = time;
        this.counting = true;
    }
}
