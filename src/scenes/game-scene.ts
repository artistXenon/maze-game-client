import { Engine } from "artistic-engine";
import { Scene } from "artistic-engine/sprite";
import { IPointerListener } from "artistic-engine/event";
import { Modifier, SequentialModifier } from "artistic-engine/modifiers";
import { getAssetManager } from "../asset";
import { CustomEngine, getEngine } from "../engine";
import { mazeDrawer } from "../helper/maze-drawer";
import { KeyListener } from "../helper/key-listener";
import { OnlineSessionHub } from "../online/session-hub";
import { GameHandler } from "../online/game-handler";
import { LocalConfig } from "../states/local-config";
import { CountSprite, PlayerSprite } from "../elements/game";
import { AbstractState, LocalState } from "../online/states";
import BaseModal from "../elements/base-modal";

// TODO: u know
const SPEED = 10 / 1000;
const maze_x = 1920 * 0.1, maze_y = 1080 * 0.1, maze_w = 1920 * 0.8, maze_h = 1080 * 0.8;
const cell_w = maze_w / 32;

class GameScene extends Scene implements IPointerListener, KeyListener {

    private resultModal?: BaseModal;

    private counter: CountSprite = new CountSprite();

    private localPlayer: PlayerSprite = new PlayerSprite(`blue`);
    
    private remotelPlayer: PlayerSprite = new PlayerSprite(`red`);

    // private animationModifier: Modifier;

    constructor() {
        super({ W: 1920, H: 1080 });
        // INFO: why is this here: i just wanted to leave an example of how to use assets and modifiers for future.
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
        this.attachChildren([this.counter, this.remotelPlayer, this.localPlayer]);
    }

    override onDraw(context: CanvasRenderingContext2D, delay: number): void {
        context.fillStyle = "skyblue";
        context.fillRect(0, 0, this.W, this.H);

        const room = OnlineSessionHub.get.Room;
        if (room === undefined) return;
        const maze = room.GameHandler.Maze;
        mazeDrawer(context, maze, { x: maze_x, y: maze_y, w: maze_w, h: maze_h });
        const now = performance.now();
        this.playerPositionUpdate(now, room.LocalState, this.localPlayer);
        if (room.RemoteState !== undefined) {
            this.playerPositionUpdate(now, room.RemoteState, this.remotelPlayer);
        }
    }

    public onAttachEngine(engine: Engine, previousScene: Scene): void {
        const e = <CustomEngine>engine;
        e.PointerGroup.registerPointerListener(this);
        if (this.resultModal === undefined) return;
        this.resultModal.setParent(null);
        e.PointerGroup.unregisterPointerListener(this.resultModal);
    }

    public onDetachEngine(engine: Engine): void {
        (<CustomEngine>engine).PointerGroup.unregisterPointerListener(this);
    }

    onPointer(
        type: string,
        button: number,
        localX: number,
        localY: number,
        inBound: boolean,
        e: PointerEvent,
    ): boolean {
        // TODO: button check?
        if (type === "pointerdown") {
        }

        return true;
    }
    
    onKey(e: KeyboardEvent): void {
        OnlineSessionHub.get.Room?.GameHandler.onKey(e);
    }

    public init(gameHandler: GameHandler) {
        gameHandler.updateMaze(LocalConfig.get.MazeSeed, LocalConfig.get.MazeWidth, LocalConfig.get.MazeHeight);
        getEngine().Scene = this;
        // TODO: put players, put count, put controller
        this.counter.count(gameHandler.StartTime);
    }

    public gameover(result: boolean) {
        if (this.resultModal !== undefined) {
            this.detachChildren(this.resultModal);
            getEngine().PointerGroup.unregisterPointerListener(this.resultModal);
        }
        this.resultModal = new BaseModal(
            `당신이 ${result ? `승리` : `패배`}했습니다.`,
            (result ? `당신이 바로 진정한 미로 탐험가 입니다.` : `그러고도 탐험가입니까? 푸풋ㅋㅋ`) + 
            `\n 리매치를 하시겠습니까?`,
            () => OnlineSessionHub.get.Room?.SocketClient?.knock(),
            () => OnlineSessionHub.get.leaveRoom()
        );
        this.attachChildren(this.resultModal);
        getEngine().PointerGroup.registerPointerListener(this.resultModal);
    }

    private playerPositionUpdate(now: number, state: AbstractState, sprite: PlayerSprite) {
        const room = OnlineSessionHub.get.Room;
        if (room === undefined) throw new Error(`GameScene#playerPositionUpdate: undefined room.`);
        
        if (state.from.x === state.to.x) {
            if (state.from.y === state.to.y) {
                // TODO: no movement
                sprite.X = maze_x + cell_w * (0.5 + state.to.x);
                sprite.Y = maze_y + cell_w * (0.5 + state.to.y);
                return;
            }
            // INFO: y movement
            const direction = state.to.y - state.from.y > 0 ? 1 : -1;
            const rawY = state.from.y + direction * (now - state.since) * SPEED;
            const arrive = direction > 0 ? (rawY >= state.to.y) : (rawY <= state.to.y);

            sprite.X = maze_x + cell_w * (0.5 + state.to.x);
            sprite.Y = maze_y + cell_w * (0.5 + rawY);

            if (arrive) {
                sprite.Y = maze_y + cell_w * (0.5 + state.to.y);
                (<LocalState>state).onArrival(room.GameHandler);
                if (room.LocalState === state) {
                }
            }
        } else if (state.from.y === state.to.y) {
            // INFO: x movement
            const direction = state.to.x - state.from.x > 0 ? 1 : -1;
            const rawX = state.from.x + direction * (now - state.since) * SPEED;
            const arrive = direction > 0 ? (rawX >= state.to.x) : (rawX <= state.to.x);
            
            sprite.X = maze_x + cell_w * (0.5 + rawX);
            sprite.Y = maze_y + cell_w * (0.5 + state.to.y);;

            if (arrive) {
                sprite.X = maze_x + cell_w * (0.5 + state.to.x);
                (<LocalState>state).onArrival(room.GameHandler);
                if (room.LocalState === state) {
                }
            }
        } else throw new Error(`GameScene#playerPositionUpdate: diagonal movement`);


        // TODO: after update, if reached `to`, there's one other open wall, move to it.
        // TODO: none or many, to = from = now
    }
}

let gameScene: GameScene;

const getGameScene = () => {
    if (gameScene === undefined) {
        gameScene = new GameScene();
    }
    return gameScene;
};

export { GameScene, getGameScene };
