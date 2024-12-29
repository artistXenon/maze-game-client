import { IPointerListener } from "artistic-engine/event";
import { Sprite, TextSprite } from "artistic-engine/sprite";
import { getEngine } from "../engine";

export type Selection = {
    start: number;
    end: number;
};

export type InputState = {
    selection: Selection;
    value: string;
};

interface ISessionListener {
    onSessionAttach(): void;
    onSessionDetach(): void;
    beforeTextUpdate(oldState: InputState, newState: InputState): (InputState | void);
    afterTextUpdate(finalState: InputState): void;
}

class InputManager {
    private static readonly instance: InputManager = new InputManager();
    public static get get(): InputManager { return InputManager.instance; }

    private inputElement: HTMLInputElement;

    private currentSession?: ISessionListener;

    private listening: boolean = false;

    private tempState: InputState = { value: "", selection: { start: 0, end: 0 } };

    private state: InputState = { value: "", selection: { start: 0, end: 0 } };

    constructor() {
        this.inputElement = <HTMLInputElement>document.querySelector(`#input`);
        const listener = () => {
            if (this.currentSession === undefined || !this.listening) return;
            this.tempState.value = this.inputElement.value;
            const { selectionStart, selectionEnd } = this.inputElement;
            if (selectionStart != null && selectionEnd != null) 
                this.tempState.selection = { start: selectionStart, end: selectionEnd };
            this.onUpdate(this.tempState);
        };
        this.inputElement.addEventListener("input", listener);
        this.inputElement.addEventListener("select", listener);
        this.inputElement.addEventListener("keydown", (e: Event) => { 
            if (this.currentSession === undefined || !this.listening) return;
            const { key } = <KeyboardEvent>e;
            if (key === "Escape" || key === "Enter") this.disposeSession(this.currentSession);
            // TODO: cursor updates that are not invoked by events above. probably more..
            if (key === "ArrowLeft" || key === "ArrowRight" || key === "End" || key === "Home") {
                listener();
            }
        });
    }

    public get CurrentSession(): ISessionListener | undefined {
        return this.currentSession;
    }

    public requestSession(sessionListener: ISessionListener, defaultState?: InputState) {
        if (this.currentSession !== sessionListener) {
            if (this.currentSession != null) {
                this.disposeSession(this.currentSession);
            }
            this.currentSession = sessionListener;
            this.currentSession.onSessionAttach();
        }
        this.listening = true;
        this.inputElement.focus();

        if (defaultState == null) return;
        this.onUpdate(defaultState);
    }

    public disposeSession(sessionListener: ISessionListener) {
        // TODO: should provide final value?
        if (this.currentSession === sessionListener){
            sessionListener.onSessionDetach();
            this.currentSession = undefined;
            this.listening = false;
            this.inputElement.value = "";
            this.inputElement.blur();
        }
    }

    private onUpdate(input: InputState) {
        if (this.currentSession == null) return;

        let updateTo
        const preUpdate = this.currentSession.beforeTextUpdate(this.state, input);
        updateTo = preUpdate ?? this.state;

        this.listening = false;
        this.inputElement.value = updateTo.value;
        this.inputElement.setSelectionRange(updateTo.selection.start, updateTo.selection.end);
        this.state.value = updateTo.value;
        this.state.selection.start = updateTo.selection.start
        this.state.selection.end = updateTo.selection.end;
        this.listening = true;

        if (preUpdate) {
            this.currentSession.afterTextUpdate(this.state);
        }        
    }

}

export abstract class BaseText
    extends Sprite
    implements IPointerListener, ISessionListener
{
    public disabled = false;

    protected text: TextSprite;

    private downed = false;

    constructor(X: number, Y: number, W: number, H: number) {
        super({ X, Y, W, H });
        
        this.text = new TextSprite();
        this.text.Position.X = 5;
        this.text.Position.Y = 5;
        // new Vector.Vector2D(this.W / 2, this.H / 2);
        this.text.Property.fill = "white";
        this.text.Text = "";
        this.text.Property.textBaseLine = "top";
        const fontBuilder = getEngine().getFontBuilder("GowunBatang"); // TODO: change font
        if (fontBuilder) {
            this.text.Property.font = fontBuilder.setSize("30px").toString();
        }

        this.attachChildren(this.text);
    }

    public get Focused(): boolean {
        return InputManager.get.CurrentSession === this;
    }

    public get Text(): string {
        return this.text.Text;
    }

    public get Disabled(): boolean {
        return this.disabled;
    }

    public set Text(text: string) {
        this.text.Text = text;
    }

    public set Disabled(value: boolean) {
        if (!value) {
            InputManager.get.disposeSession(this);
        }
        this.disabled = value;
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
                this.getFocus(true);
            } else if (type === "pointermove") {
                // pointerover, pointerenter
                this.onHover(e);
            }
            return true;
        } else {
            if (type === "pointermove") {
                this.downed = false;
                this.onDrop(e);
            } else if (this.Focused) {
                if (type === "pointerdown" || type === "pointerup") {
                    this.getFocus(false);
                }
            }
            return false;
        }
    }

    public getFocus(toggle: boolean) {
        if (toggle) {
            const value = this.text.Text;
            InputManager.get.requestSession(this, { value, selection: { start: value.length, end: value.length }});
        }
        else {
            InputManager.get.disposeSession(this);
        }
    }

    public onDraw(context: CanvasRenderingContext2D, delay: number): void {
        context.fillStyle = `grey`;
        context.fillRect(0, 0, this.W, this.H);
    }

    public onSessionAttach(): void {}
    public onSessionDetach(): void {}
    public beforeTextUpdate(oldState: InputState, newState: InputState): (InputState | void) { return newState; }
    public afterTextUpdate(finalState: InputState): void {
        const { value } = finalState;
        this.text.Text = value;
    }

    public onDown(e: PointerEvent): void {}
    public onUp(e: PointerEvent): void {}
    public onHover(e: PointerEvent): void {}
    public onDrop(e: PointerEvent): void {}
}

