import { Engine } from "artistic-engine";
import { Scene } from "artistic-engine/sprite";
import { IPointerListener } from "artistic-engine/event";
import { CustomEngine } from "../engine";
import { getGameScene } from "./game-scene";
import { CreateRoomButton, JoinRoomButton, QIDText } from "../elements/main";

class MainScene extends Scene implements IPointerListener {
    private title: ImageBitmap | undefined;

    private logoOpacity: number = 0;

    private createButton: CreateRoomButton;

    private joinButton: JoinRoomButton;

    // private startButton: RandomStartButton;

    private QIDText: QIDText;

    // private animationModifier: Modifier;

    constructor() {
        super({ W: 1920, H: 1080 });
        // getAssetManager()
        //     .getImage("title-logo")
        //     .then((ibm) => (this.title = ibm));

        // this.animationModifier = new SequentialModifier(
        //     new Modifier(0, 1, 2500, (v) => (this.logoOpacity = v)),
        //     new Modifier(1, 1, 3000, () => {}),
        //     new Modifier(1, 0, 1500, (v) => {
        //         this.logoOpacity = v;
        //         if (v === 0) {
        //             this.skip();
        //         }
        //     }),
        // );


        this.QIDText = new QIDText();
        this.QIDText.Position.X = 1060;
        this.QIDText.Position.Y = 720;

        this.createButton = new CreateRoomButton();
        this.createButton.Position.X = 1060;
        this.createButton.Position.Y = 400;
    
        this.joinButton = new JoinRoomButton(this.QIDText);
        this.joinButton.Position.X = 1060;
        this.joinButton.Position.Y = 560;
        

        const children = [this.QIDText, this.createButton, this.joinButton];
        this.attachChildren(children);
    }

    override onDraw(context: CanvasRenderingContext2D, delay: number): void {
        context.fillStyle = "pink";
        context.fillRect(0, 0, this.W, this.H);
        if (this.title) {
            context.globalAlpha = this.logoOpacity;
            // TODO: hard-coded logo position, size
            context.drawImage(this.title, 320, 180, 1280, 720);
            context.globalAlpha = 1;
        }
    }

    public onAttachEngine(engine: Engine, previousScene: Scene): void {
        const e = <CustomEngine>engine;
        this.QIDText.Text = ``;
        this.QIDText.Disabled = false;
        this.createButton.Disabled = false;
        this.joinButton.Disabled = false;
        e.PointerGroup.registerPointerListener(this, this.QIDText, this.createButton, this.joinButton);
    }

    public onDetachEngine(engine: Engine): void {
        (<CustomEngine>engine).PointerGroup.unregisterPointerListener(this, this.QIDText, this.createButton, this.joinButton);
    }

    onPointer(
        type: string,
        button: number,
        localX: number,
        localY: number,
        inBound: boolean,
        e: PointerEvent,
    ): boolean { return true; }


    public enableLoading(enable: boolean) {
        this.QIDText.Disabled = enable;
        this.createButton.Disabled = enable;
        this.joinButton.Disabled = enable;
    }

    // public startGame(time: number) {
    //     const gameScene = getGameScene();
    //     getEngine().Scene = gameScene;
    //     gameScene.init(time);

    // }
}

let splashScene: MainScene;

const getMainScene = () => {
    if (splashScene === undefined) {
        splashScene = new MainScene();
    }
    return splashScene;
};

export { MainScene, getMainScene };