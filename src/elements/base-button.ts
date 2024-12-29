import { IPointerListener } from "artistic-engine/event";
import { Sprite } from "artistic-engine/sprite";

export default abstract class BaseButton
    extends Sprite
    implements IPointerListener
{
    public Disabled = false;

    private downed = false;

    constructor(X: number, Y: number, W: number, H: number) {
        super({ X, Y, W, H });
    }

    onPointer(
        type: string,
        button: number,
        localX: number,
        localY: number,
        inBound: boolean,
        e: PointerEvent,
    ): boolean {
        if (this.Disabled) return true;

        if (inBound) {
            if (type === "pointerdown") {
                this.downed = true;
                this.onDown(e);
            } else if (type === "pointerup" && this.downed) {
                this.downed = false;
                this.onUp(e);
            } else if (type === "pointermove") {
                // pointerover, pointerenter
                this.onHover(e);
            }
            return true;
        } else {
            if (type === "pointermove") {
                this.downed = false;
                this.onDrop(e);
            }
            return false;
        }
    }

    public abstract onDraw(
        context: CanvasRenderingContext2D,
        delay: number,
    ): void;

    public abstract onDown(e: PointerEvent): void;
    public abstract onUp(e: PointerEvent): void;
    public abstract onHover(e: PointerEvent): void;
    public abstract onDrop(e: PointerEvent): void;
}