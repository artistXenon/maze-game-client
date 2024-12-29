import { HttpClient } from "./http";
import { ISocketListener, SocketClient } from "./ws";
import { getMainScene } from "../scenes/main-scene";
import { getEngine } from "../engine";
import { Room } from "../states/room";
import { LocalState } from "../states/local";
import { LocalClient } from "./local-client";
import { RemoteState } from "../states/remote";
import { GameHandler } from "./game-handler";
import { getGameScene } from "../scenes/game-scene";


export class ClientManager implements ISocketListener {
    private static instance: ClientManager = new ClientManager();

    public static get get(): ClientManager { return ClientManager.instance; }

    private httpClient: HttpClient = new HttpClient();

    private client?: LocalClient;

    private room?: Room;

    private socketClient?: SocketClient;

    private gameHandler?: GameHandler;

    constructor() {
        (<any>window).clientManager = this;
    }

    public get GameHandler(): GameHandler | undefined {
        return this.SocketClient ? this.gameHandler: undefined;
    }

    public get SocketClient(): SocketClient | undefined {
        return this.Room ? this.socketClient : undefined;
    }

    public get Room(): Room | undefined {
        return this.client ? this.room : undefined;
    }

    public get Client(): LocalClient | undefined {
        return this.client;
    }

    public unregisterClient(): void {
        this.leaveRoom();
        if (this.client !== undefined) {
            const recipe = this.client.cookSecret(`:unregister_client:`);
            const [id, secret, rice] = recipe;
            this.httpClient.unregisterClient(id, secret, rice);
            this.client = undefined;
        }
        return;
    }

    private async renewClient(): Promise<boolean> {
        if (this.client === undefined) return false;
        const recipe = this.client.cookSecret(`:renew_client:`);
        const [id, secret, rice] = recipe;
        const res = await this.httpClient.extendClientExpiration(id, secret, rice);
        return res.q;
    }

    public async registerClient(): Promise<boolean> {
        try {
            // INFO: if client exist, attempt renew, else abandon client
            if (this.client !== undefined) {
                const ext = await this.renewClient();
                if (ext) return true;
                else this.unregisterClient();
            }

            const res = await this.httpClient.registerClient();
            if (!res.q) return false;
            this.client = new LocalClient(
                res.id, 
                `player` + (Date.now() % 1000), 
                res.s
            );
            return true;
        }
        catch (e) {
            console.error(e);
            return false;
        }
    }

    public async createRoom() {
        if (this.client === undefined && !(await this.registerClient())) return false;  
        // INFO: above is a null check for client. 
        const localClient = this.client!;      

        const recipe = localClient.cookSecret(`:create_room:`);

        try {
            const [id, secret, rice] = recipe;
            const res = await this.httpClient.createRoom(id, secret, rice);
            if (!res.q) return false;
            const [_, sec, rc] = localClient.cookSecret(`:socket_join:`);
            this.socketClient = await SocketClient.create(res.id, localClient, sec, rc, this);

            return true;
        }
        catch (e) {
            console.error(e);
            return false;
        }
    }

    public async joinRoom(room: string) {
        if (this.client === undefined && (await this.registerClient())) return false;
        // INFO: above is a null check for client. 
        const localClient = this.client!;

        const recipe = localClient.cookSecret(`:join_room:`);

        try {
            const [id, secret, rice] = recipe;
            const res = await this.httpClient.joinRoom(id, secret, rice, room);
            if (!res.q) return false;
            const [_, sec, rc] = localClient.cookSecret(`:socket_join:`);
            this.socketClient = await SocketClient.create(res.id, localClient, sec, rc, this);
            return true;
        }
        catch (e) {
            console.error(e);
            return false;
        }
    }

    public leaveRoom() {
        this.socketClient?.destroy();
        this.socketClient = undefined;

        if (this.room !== undefined) {
            this.room = undefined;
        }

        if (this.gameHandler !== undefined) {
            this.gameHandler.destroy();
            this.gameHandler = undefined;
        }
    }

    public onClose(e: CloseEvent | Error) {
        if (e instanceof Error) {
            console.error(e);
            return;
        }
        console.log('wow closed cuz: ' + e.reason);
        this.leaveRoom();
        this.renewClient();
        getEngine().Scene = getMainScene();
        // TODO: return to lobby
        // TODO: and additional cleanup
    }

    public onReady(room: Room) {
        this.room = room;
        this.gameHandler = new GameHandler();
    }

    public onStart(plannedBalls: number, plannedConfig: number, positionIndex: number) {   
        const room = this.Room;
        if (room === undefined) throw new Error(`ClientManager#onStart: undefined Room.`);
        if (this.gameHandler === undefined) throw new Error(`ClientManager#onStart: undefined GameHandler.`);
        room.Config = plannedConfig;
        room.StartTime = plannedBalls;
        room.LocalState.initialPosition(positionIndex, { w: 16, h: 9 });
        room.RemoteState?.initialPosition(1 - positionIndex, { w: 16, h: 9 });
        this.gameHandler.Gaming = true;
        getGameScene().init(room);
    }

    public onOpponent(id: string, name: string, offset: number) {
        // INFO: only called when opponent added to room.
        if (this.room === undefined) throw new Error(`ClientManager#onOpponent: undefined room.`);
        this.room.RemoteState = new RemoteState(id, name, offset);
    }

    public onGameMsg(msg: any): void {
        if (this.room === undefined) throw new Error(`ClientManager#onGameMsg: undefined room.`);
        if (this.gameHandler === undefined) throw new Error(`ClientManager#onGameMsg: undefined gameHandler.`);
        this.gameHandler.onGameMsg(msg);
    }
}
