import { LocalConfig } from "../states/local-config";
import { GameHandler } from "./game-handler";
import { LocalClient } from "./local-client";
import { LocalState } from "./local-state";
import { RemoteState } from "./remote-state";
import { OnlineSessionHub } from "./session-hub";
import { ISocketListener, SocketClient } from "./socket-client";

export class Room implements ISocketListener {

    private id: string;

    private gameHandler: GameHandler;

    private socketClient?: SocketClient;

    private localState: LocalState;

    private remoteState?: RemoteState;

    constructor(id: string, localClient: LocalClient, isLocalMom: boolean) {
        this.id = id;
        this.gameHandler = new GameHandler();
        this.socketClient = SocketClient.create(id, localClient, this);
        this.localState = new LocalState(isLocalMom);
    }

    public get Id() {
        return this.id;
    }

    public get GameHandler() {
        return this.gameHandler;
    }

    public get SocketClient() {
        return this.socketClient;
    }

    public get LocalState() {
        return this.localState;
    }

    public get RemoteState() {
        return this.remoteState;
    }

    public leave() {
        this.gameHandler.Gaming = false;
        this.socketClient?.destroy();
        this.remoteState = undefined;
    }

    onOpen(): void {
        throw new Error("Method not implemented.");
    }

    onUpdate(type: string, args?: any): void {
        switch (type) {
            case `ready`:
                if (args.isMoM !== this.localState.IsMom) {
                    throw new Error(`Room#onUpdate: illegal mommy.`);
                }
                this.socketClient?.knock();
                break;
            case `start`:
                const { config, startTime, positionIndex } = args;
                LocalConfig.get.MazeSeed = config;
                this.localState.initialPosition(positionIndex);
                this.remoteState?.initialPosition(1 - positionIndex);
                this.gameHandler.start(startTime);
                break;
            case `opponent-join`:
                const { id, name, offset } = args;
                this.remoteState = new RemoteState(id, name, !this.localState.IsMom, offset);
                break;
        }
    }

    onGameMessage(args: any): void {
        this.gameHandler.onGameMessage(args);
    }

    onClose(reason: any): void {
        // console.error(reason);
        OnlineSessionHub.get.leaveRoom();        
    }    
}
