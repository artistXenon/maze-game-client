import { Sprite, TextSprite } from "artistic-engine/sprite";
import BaseButton from "./base-button";
import { IPointerListener } from "artistic-engine/event";
import { getEngine } from "../engine";

export default class BaseModal extends Sprite implements IPointerListener {
    protected modalBody: BaseModalBody;

    protected modalConfirm: BaseModalButton;

    protected modalCancel: BaseModalButton | undefined;

    constructor(
        title: string,
        desc: string,
        onConfirm: (bm: BaseModal) => void,
        onCancel?: (bm: BaseModal) => void,
    ) {
        super({ W: 1920, H: 1080 });
        this.modalBody = new BaseModalBody(title, desc);
        this.modalConfirm = new BaseModalButton(this, onConfirm);
        this.modalBody.attachChildren(this.modalConfirm);
        this.modalConfirm.X = (this.modalBody.W - this.modalConfirm.W) / 2;
        this.modalConfirm.Y = this.modalBody.H - this.modalConfirm.H - 40;
        // TODO: set position
        const canCancel = onCancel !== undefined;
        if (canCancel) {
            this.modalCancel = new BaseModalButton(this, onCancel, "red");
            this.modalBody.attachChildren(this.modalCancel);
            this.modalConfirm.X =
                (this.modalBody.W / 2 - this.modalConfirm.W) / 2;
            this.modalCancel.X =
                ((this.modalBody.W * 3) / 2 - this.modalConfirm.W) / 2;
            this.modalCancel.Y = this.modalBody.H - this.modalConfirm.H - 40;
            // set potision
        }
        this.attachChildren(this.modalBody);
    }

    onDraw(context: CanvasRenderingContext2D, delay: number): void {
        context.globalAlpha = 0.5;
        context.fillStyle = "white";
        context.fillRect(0, 0, this.W, this.H);
        context.globalAlpha = 1;
    }

    onPointer(
        type: string,
        button: number,
        localX: number,
        localY: number,
        inBound: boolean,
        e: PointerEvent,
    ): boolean {
        localX -= this.modalBody.X;
        localY -= this.modalBody.Y;
        const inBodyBound =
            localX > 0 &&
            localY > 0 &&
            localX < this.modalBody.W &&
            localY < this.modalBody.H;
        if (inBodyBound) {
            // TODO: for buttons
            const confirmX = localX - this.modalConfirm.X,
                confirmY = localY - this.modalConfirm.Y;
            const inConfirm =
                confirmX > 0 &&
                confirmY > 0 &&
                confirmX < this.modalConfirm.W &&
                confirmY < this.modalConfirm.H;
            if (inConfirm)
                this.modalConfirm.onPointer(
                    type,
                    button,
                    confirmX,
                    confirmY,
                    inConfirm,
                    e,
                );
            if (this.modalCancel) {
                const cancelX = localX - this.modalCancel.X,
                    cancelY = localY - this.modalCancel.Y;
                const inCancel =
                    cancelX > 0 &&
                    cancelY > 0 &&
                    cancelX < this.modalCancel.W &&
                    cancelY < this.modalCancel.H;
                if (inCancel)
                    this.modalCancel.onPointer(
                        type,
                        button,
                        cancelX,
                        cancelY,
                        inCancel,
                        e,
                    );
            }
        } else if (type === "pointerdown") {
            this.close();
        }

        // if (out of body)
        // close modal
        // else
        // call on buttons
        return true;
    }

    public close() {
        getEngine().PointerGroup.unregisterPointerListener(this);
        this.setParent(null);
    }
}

class BaseModalBody extends Sprite {
    private title: TextSprite;

    private desc: TextSprite;

    constructor(title: string, desc: string) {
        const w = 1920, h = 1080;
        super({ X: w * 0.15, Y: h * 0.15, W: w * 0.7, H: h * 0.7 });

        this.title = new TextSprite();
        this.desc = new TextSprite();

        this.title.Text = title;
        this.title.X = 40;
        this.title.Y = 40;
        this.title.Property.fill = "black";
        this.title.Property.textAlign = "left";
        this.title.Property.textBaseLine = "top";

        this.desc.Text = desc;
        this.desc.X = 40;
        this.desc.Y = 120;
        this.desc.Property.fill = "black";
        this.desc.Property.textAlign = "left";
        this.desc.Property.textBaseLine = "top";
        this.desc.Property.lineSpacing = 28;
        // TODO: replace font
        const fontBuilder = getEngine().getFontBuilder("GowunBatang");
        if (fontBuilder) {
            this.title.Property.font = fontBuilder.setSize("40px").toString();
            this.desc.Property.font = fontBuilder.setSize("25px").toString();
        }

        this.attachChildren([this.title, this.desc]);
    }
    onDraw(context: CanvasRenderingContext2D, delay: number): void {
        context.fillStyle = "white";
        context.fillRect(0, 0, this.W, this.H);
    }
}

class BaseModalButton extends BaseButton {
    private modal: BaseModal;

    private onButtonClick: (bm: BaseModal) => void;

    private color;

    // text sprite

    // private text: TextSprite;

    constructor(
        baseModal: BaseModal,
        onClick: (bm: BaseModal) => void,
        color = "green",
    ) {
        super(0, 0, 200, 100);
        this.modal = baseModal;
        this.onButtonClick = onClick;
        this.color = color;

        // this.text = new TextSprite({ X: this.W / 2, Y: this.H / 2 });
        // this.text.Property.fill = "white";
        // this.text.Text = this.name;
        // this.text.Property.textAlign = "center";
        // this.text.Property.textBaseLine = "middle";
        // const fontBuilder = RunningEngine().getFontBuilder("GowunBatang");
        // if (fontBuilder) {
        //     this.text.Property.font = fontBuilder.setSize("30px").toString();
        // }
        // this.attachChildren(this.text);
    }

    public onDraw(context: CanvasRenderingContext2D, delay: number): void {
        context.fillStyle = this.color;
        context.fillRect(0, 0, this.W, this.H);
    }

    public onDown(e: PointerEvent): void {}
    public onUp(e: PointerEvent): void {
        this.onButtonClick(this.modal);
    }
    public onHover(e: PointerEvent): void {}
    public onDrop(e: PointerEvent): void {}
}