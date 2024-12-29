import { TextSprite } from "artistic-engine/sprite";
import BaseButton from "./base-button";
import { getEngine } from "../engine";

export default class Button extends BaseButton {
    private name;

    private color;

    // text sprite

    private text: TextSprite;

    constructor(name = "", color = "red") {
        super(0, 0, 200, 100);
        this.name = name;
        this.color = color;

        this.text = new TextSprite();
        this.text.Position.X = this.W / 2;
        this.text.Position.Y = this.H / 2;
        // new Vector.Vector2D(this.W / 2, this.H / 2);
        this.text.Property.fill = "white";
        this.text.Text = this.name;
        this.text.Property.textAlign = "center";
        this.text.Property.textBaseLine = "middle";
        const fontBuilder = getEngine().getFontBuilder("GowunBatang"); // TODO: change font
        if (fontBuilder) {
            this.text.Property.font = fontBuilder.setSize("30px").toString();
        }

        this.attachChildren(this.text);
    }

    public onDraw(context: CanvasRenderingContext2D, delay: number): void {
        context.fillStyle = this.color;
        context.fillRect(0, 0, this.W, this.H);
    }

    public onDown(e: PointerEvent): void {}
    public onUp(e: PointerEvent): void {
        console.log("CLICKED OMG");
    }
    public onHover(e: PointerEvent): void {}
    public onDrop(e: PointerEvent): void {}
}