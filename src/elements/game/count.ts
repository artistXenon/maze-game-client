import { Sprite } from "artistic-engine/sprite";
import { getEngine } from "../../engine";

export class Count extends Sprite {
    private static frame_unit = 1000;

    private counting: boolean = false;

    private countTo: number = 0;

    constructor() {
        super({ X: 900, Y: 500 });
    }

    public get Time() {
        return this.countTo - performance.now();
    }

    onDraw(context: CanvasRenderingContext2D, delay: number): void {
        // TODO: pretty~
        const diff = this.Time;
        const currentFrame = 
            diff > Count.frame_unit * 3 ? `Ready` :
            diff > Count.frame_unit * 2 ? `3` :
            diff > Count.frame_unit * 1 ? `2` :
            diff > 0 ? `1` : `GO`;
        context.fillStyle = `white`;
        // TODO: 
        context.font = getEngine().getFontBuilder("GowunBatang")!.setSize(`50px`).toString();
        context.fillText(currentFrame, 0, 0);
        if (this.counting && currentFrame === `GO`) {
            this.counting = false;
            setTimeout(() => {
                this.setParent(null);
            }, 1000);
        }
    }

    public count(time: number) {
        if (this.Parent == null) return;
        this.countTo = time;
        this.counting = true;
    }
}
