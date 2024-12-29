import { GameScene, getGameScene } from "../scenes/game-scene";
import { LocalState } from "../states/local";
import { RemoteState } from "../states/remote";
import { Room } from "../states/room";
import { ClientManager } from "./client-manager";
import { LocalClient } from "./local-client";

class GameHandler {
    private gameScene: GameScene = getGameScene();

    private localClient: LocalClient;
    
    private room: Room;

    private localState: LocalState;

    private remoteState?: RemoteState;

    private gaming: boolean = false;

    private interval?: ReturnType<typeof setInterval>;

    constructor() {
        const localClient = ClientManager.get.Client;
        if (localClient === undefined) throw new Error(`GameHandler#constructor: undefined LocalClient.`);
        this.localClient = localClient;
        const room = ClientManager.get.Room;
        if (room === undefined) throw new Error(`GameHandler#constructor: undefined Room.`);
        this.room = room;
        this.localState = room.LocalState;
    }

    public get Gaming() {
        return this.gaming;
    }

    public set Gaming(gaming: boolean) {
        this.gaming = gaming;
        this.remoteState = this.room.RemoteState;
        clearInterval(this.interval);
        if (gaming) {
            this.interval = setInterval(() => this.upsync(), 1000 / 30);
        }
    }

    public onGameMsg(msg: any) {
        if (!this.gaming) return;
        if (this.remoteState === undefined) throw new Error(`GameHandler#onGameMsg: undefined RemoteState.`);
        // const socketClient = ClientManager.get.SocketClient;
        // if (socketClient === undefined) throw new Error(`#gameHandler: undefined SocketClient.`);
        const { gt } = msg;
        // TODO: check is this time correct??
        const convertedTime = gt + this.remoteState.Offset;
        // TODO: calculate ping?


        switch (msg.t) {
            case `move`:
                const { from, to, since } = msg;
                this.remoteState.sync(from, to, since);
                break;

            // case `sync`:
            //     const { } = msg;
            //     // update local state?
            //     break;
                
        
            case `end`:
                // TODO: handle game over
                break;
        }
    }

    public onKey(e: KeyboardEvent) {
        // TODO: if moving return
        const localState = this.localState;
        if (localState.to.x !== localState.from.x || localState.to.y !== localState.from.y) return;

        // TODO: set from, to, since
        if (e.type !== `keydown`) return;
        let nextDest = { x: localState.from.x, y: localState.from.y };        
        let [ up, down, left, right ] = this.gameScene.Maze!.getSurroundingWalls(nextDest.x, nextDest.y);
        
        console.log(
            `${e.key}: up down left right ${up} ${down} ${left} ${right}\n` + 
            `position: ${nextDest.x} ${nextDest.y}`);
        switch (e.key) {
            case `ArrowUp`:
                if (up) return;
                do {
                    nextDest.y -= 1;
                    up = this.gameScene.Maze!.getSurroundingWalls(nextDest.x, nextDest.y)[0];
                } while (!up && left && right && false);
                break;
            
            case `ArrowDown`:
                if (down) return;
                do {
                    nextDest.y += 1;
                    down = this.gameScene.Maze!.getSurroundingWalls(nextDest.x, nextDest.y)[1];
                } while (!down && left && right && false);
                break;
                    
            case `ArrowLeft`:
                if (left) return;
                do {
                    nextDest.x -= 1;
                    left = this.gameScene.Maze!.getSurroundingWalls(nextDest.x, nextDest.y)[2];
                } while (!left && up && down && false);
                break;
                
            case `ArrowRight`:
                if (right) return;
                do {
                    nextDest.x += 1;
                    right = this.gameScene.Maze!.getSurroundingWalls(nextDest.x, nextDest.y)[3];
                } while (!right && up && down && false);
                break;
            default: 
                return;
        }
        localState.to.x = nextDest.x;
        localState.to.y = nextDest.y;
        localState.since = performance.now();
    }

    public upsync() {
        const { from, to, since } = this.localState;
        const state = { from, to, since };
        this.immediate(`move`, state);
        // TODO: get local state and send immediate
    }

    public immediate(msgType: string, args: any) {
        args.t = msgType;
        args.gt = performance.now();
        ClientManager.get.SocketClient?.send(args);
    }

    public destroy() {
        this.Gaming = false;
        const dead = <any>this;
        dead.gameScene = undefined;
        dead.localClient = undefined;
        dead.room = undefined;
        dead.localState = undefined;
        dead.remoteState = undefined;
    }
}

export { GameHandler };
