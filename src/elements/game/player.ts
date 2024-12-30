import { Sprite } from "artistic-engine/sprite";

export default class PlayerSprite extends Sprite {
    private static readonly size = 10;

    private c: string;

    constructor(c: string) {
        super();
        this.c = c;
    }
    onDraw(context: CanvasRenderingContext2D, delay: number): void {
        context.fillStyle = this.c;
        context.fillRect(PlayerSprite.size / -2, PlayerSprite.size / -2, PlayerSprite.size, PlayerSprite.size);
    }
}
