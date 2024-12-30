import { coord } from "../helper/types";
import { Maze } from "../maze";
import { getGameScene } from "../scenes/game-scene";
import { OnlineSessionHub } from "./session-hub";
import { AbstractState } from "./states";

export class GameHandler {
    private gaming: boolean = false;

    private gameStartTime: number = Infinity;

    private maze: Maze;

    private interval?: ReturnType<typeof setInterval>;

    constructor() {
        this.maze = new Maze(0);
    }

    public get StartTime() {
        return this.gameStartTime;
    }

    public get Gaming() {
        return this.gaming;
    }

    public get Maze() {
        return this.maze;
    }

    public set Gaming(gaming: boolean) {
        this.gaming = gaming;
        
        clearInterval(this.interval);
        if (gaming) {
            this.interval = setInterval(() => this.upsync(), 1000 / 30);
        }
    }

    public start(time: number) {
        this.gameStartTime = time;
        this.Gaming = true;
        getGameScene().init(this);
    }

    public updateMaze(seed: number, width: number, height: number) {
        this.maze = new Maze(seed, width, height);
        this.maze.generate();
    }

    public upsync() {
        const localState = OnlineSessionHub.get.Room?.LocalState;
        if (localState === undefined) {
            this.Gaming = false;
            return;
        }
        const { from, to, since } = localState;
        const state = { from, to, since };
        this.immediate(`move`, state);
    }

    public immediate(type: string, args?: any) {
        let a = args ?? {};
        a.t = type;
        a.gt = performance.now();
        OnlineSessionHub.get.Room?.SocketClient?.send(a);
    }    

    public onKey(e: KeyboardEvent) {
        // INFO: if moving return
        const localState = OnlineSessionHub.get.Room?.LocalState;
        if (localState === undefined) return;
        if (localState.to.x !== localState.from.x || localState.to.y !== localState.from.y) return;

        if (e.type !== `keydown`) return;
        if (this.gameStartTime > performance.now()) return;
        let nextDest = { x: localState.from.x, y: localState.from.y };        
        let [ up, down, left, right ] = this.maze.getSurroundingWalls(nextDest.x, nextDest.y);

        switch (e.key) {
            case `ArrowUp`:
                if (up) return;
                nextDest.y -= 1;
                break;
            case `ArrowDown`:
                if (down) return;
                nextDest.y += 1;
                break;
            case `ArrowLeft`:
                if (left) return;
                nextDest.x -= 1;
                break;
            case `ArrowRight`:
                if (right) return;
                nextDest.x += 1;
                break;
            default: 
                return;
        }
        localState.to.x = nextDest.x;
        localState.to.y = nextDest.y;
        localState.since = performance.now();
    }
    
    public onGameMessage(msg: any) {
        if (!this.gaming) return;
        const remoteState = OnlineSessionHub.get.Room?.RemoteState;
        if (remoteState === undefined) throw new Error(`GameHandler#onGameMsg: undefined RemoteState.`);
        // const socketClient = ClientManager.get.SocketClient;
        // if (socketClient === undefined) throw new Error(`#gameHandler: undefined SocketClient.`);
        const { gt } = msg;
        // TODO: check is this time correct??
        const convertedTime = gt + remoteState.Offset;
        // TODO: calculate ping?


        switch (msg.t) {
            case `move`:
                const { from, to, since } = msg;
                remoteState.sync(from, to, since);
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

    public evaluatePause(state: AbstractState, coord: coord): boolean {
        if (state.Goal.x === coord.x && state.Goal.y === coord.y) {
            const room = OnlineSessionHub.get.Room;
            if (room?.LocalState === state) {
                room.SocketClient?.end();
            }
            return true;
        }
        return false;
    }
}
