// INFO: trying out ideal online manager

type Hosts = {
    http: string; ws: string;
}
// INFO: http related types
type HttpEndPoint = `auth` | `room`;
type AuthMethodType = `anon` | `idpw` | `token`;
type RoomMethodType = `join` | `create` | `rand`;

type HttpPayload = { end: HttpEndPoint; };
type HttpRequest = HttpPayload & { end: HttpEndPoint; extra?: string; /* TODO: token/hash to check integrity */ };
type HttpResponse = HttpPayload & { success: boolean; extra?: string; /* TODO: token/hash to check integrity */ };

type HttpAuthPayload = HttpPayload & { end: `auth`; type: AuthMethodType; };
type HttpAuthRequest = HttpAuthPayload & HttpRequest & { extra?: never; };
type HttpAuthResponse = HttpAuthPayload & HttpResponse & ({ success: true; uid: string; extra: string; } | { success: false; });

type HttpRoomPayload = HttpPayload & { end: `room`; type: RoomMethodType; };
type HttpCreateRoomPayload = HttpRoomPayload & { type: `create`; };
type HttpJoinRoomPayload = HttpRoomPayload & { type: `join`; id?: string; };
type HttpCreateRoomRequest = HttpCreateRoomPayload & HttpRequest;
type HttpJoinRoomRequest = HttpJoinRoomPayload & HttpRequest;
type HttpRoomResponse = HttpRoomPayload & HttpResponse & ({ success: true; id: string; } | { success: false; });

// INFO: websocket related types
type SocketState = 0 | 1; // 0: no connection, 1: meta exchange complete (time etc)

type SocketMessageType = `hi` | `time` | `bye`;
type SocketArguments = {};
type SocketHiArguments = SocketArguments & { uid: string; };
type SocketMessage = { type: SocketMessageType; args?: SocketArguments; };
type SocketHiMessage = SocketMessage & { type: `hi`; args: SocketHiArguments; };


// INFO: game related states
type RoomState = 0 | 1; // 0: idle room, 1: gaming
type RoomUpdate = `member`;
abstract class AbstractRoom<TData> {
    // TODO: must handle events from server to update room. w/ abstract method for user control
    private id: string;
    private state: RoomState;
    private data: TData;
    constructor(id: string, state: RoomState, data: TData) { 
        this.id = id;
        this.state = state;
        this.data = data;
    }
    public get Id() { return this.id; }
    public get State() { return this.state; }
    public get Data() { return this.data; }
}

abstract class AbstractPlayer<TAutoData, TManualData> {
    // TODO: must handle events from server to update data. w/ abstract method for user control
    private id: string;
    private autoSyncData: TAutoData;
    private manualSyncData: TManualData;
    constructor(id: string, syncData: TAutoData, passiveData: TManualData) {
        this.id = id;
        this.autoSyncData = syncData;
        this.manualSyncData = passiveData;
    }
    public get Id() { return this.id; }
    public get SyncData() {
        return this.autoSyncData;
    }
    public get PassiveData() {
        return this.manualSyncData;
    }
}


abstract class AbstractAuthHandler {
    private uid?: string;
    protected extra?: string;
    public get Uid() { return this.uid; }
    public abstract getAuthRequest(): HttpAuthRequest;
    public onAuthResponse(authResponse: HttpAuthResponse): void { 
        if (authResponse.success) {
            this.uid = authResponse.uid;
            this.extra = authResponse.extra;
        }
    }
    public abstract onAuthError(e: any): void;
    public abstract signHttpRequest<T extends HttpPayload>(request: T): any;
    public abstract signWsMessage<T extends SocketMessage>(message: T): any;
}

abstract class AbstractRoomHandler<T extends AbstractRoom<unknown>> {
    private roomBuilder: (id: string, state: RoomState) => T;
    private room?: T;
    // TODO: better params
    constructor(roomBuilder: (id: string, state: RoomState) => T) {
        this.roomBuilder = roomBuilder;
    }
    public get Room() { return this.room; }
    public onAssigned(response: HttpRoomResponse): void {}
    public onJoin(id: string, state: RoomState): void {
        this.room = this.roomBuilder(id, state);
    }
    public abstract onUpdate(type: RoomUpdate, data: any): void;
    public abstract onGameMessage(json: any): void;
    public abstract onLeave(): void;
}

class HttpManager {
    private host: string;
    constructor(host: string) { this.host = host; }
    public async signIn(request: HttpAuthRequest): Promise<HttpAuthResponse> { throw new Error(`implement`); } // TODO:
    public async createRoom(request: HttpCreateRoomRequest): Promise<HttpRoomResponse> { 
        throw new Error(`implement`); 
    }
    public async joinRoom(request: HttpJoinRoomRequest): Promise<HttpRoomResponse> { 
        throw new Error(`implement`); 
    }
}

class SocketManager {
    private host: string;
    private authHandler: AbstractAuthHandler;
    private roomHandler: AbstractRoomHandler<AbstractRoom<unknown>>;
    private state: SocketState = 0;
    private websocket?: WebSocket;
    constructor(host: string, authHander: AbstractAuthHandler, roomHandler: AbstractRoomHandler<AbstractRoom<unknown>>) { 
        this.host = host; 
        this.authHandler = authHander;
        this.roomHandler = roomHandler;
    }

    private onInit(json: any) {
        if (this.websocket === undefined) {
            this.destroy();
            return;
        }
        switch (json.type) {
            case `time`:
                // localTime, count
                const { l, c } = json.args;
                const now = performance.now();
                this.websocket.send(JSON.stringify({
                    t: 'time',
                    l: now,
                    d: now - l,
                    c
                }));
                return;
            case `ready`:
                // TODO: receive additional information about this room
                // success, state
                const { s, id, t } = json.args;
                if (s) {
                    this.roomHandler.onJoin(id, t/* TODO: pass initial room info */);
                } else {
                    this.destroy();
                }                
                return;
        }
    }
    private onUpdate(json: any) {
        // TODO: parse types
        switch (json.type) {
            case `member`:
                this.roomHandler.onUpdate(`member`, json.args);
                return;
        }
    }
    private onGameMessage(json: any) {
        this.roomHandler.onGameMessage(json);
    }

    onOpen(e: Event) {
        const message: SocketMessage = { type: `hi` };
        message.args = this.authHandler.signWsMessage(message);
        this.send(message);
    }
    onMessage(e: MessageEvent) { 
        const rawData = e.data.toString();
        const json = JSON.parse(rawData);
        if (json.type === `bye`) {
            this.destroy();
            return;
        }
        switch (this.state) {
            case 0:
                this.onInit(json);
                return;
            case 1:
                const room = this.roomHandler.Room;
                if (room === undefined) {
                    this.destroy();
                    return;
                }
                if (room.State === 0) this.onUpdate(json);
                else if (room.State === 1) this.onGameMessage(json);
                return;
        }
        throw new Error(`implement`); 
    }
    onClose(e: CloseEvent) { 
        this.destroy();
        this.roomHandler.onLeave();
    }
    onError(e: Event) { throw new Error(`implement`); }

    public connect(path: string) {
        this.destroy();
        this.websocket = new WebSocket(this.host + path);
        this.websocket.addEventListener('open', (e: Event) => this.onOpen(e));
        this.websocket.addEventListener('error', (e: Event) => this.onError(e));
        this.websocket.addEventListener('close', (e: CloseEvent) => this.onClose(e));
        this.websocket.addEventListener('message', (e: MessageEvent) => this.onMessage(e))
    }
    public send(msg: SocketMessage) {
        const ws = this.websocket;
        if (ws === undefined) throw new Error(`undefined websocket`);
        ws.send(JSON.stringify(msg));
    }

    public destroy() {
        const ws = this.websocket;
        if (ws !== undefined && ws.readyState <= 1) { ws.close(); }
        this.websocket = undefined;
        this.state = 0;
    }
}

class NetworkEngine {
    private authHandler: AbstractAuthHandler;
    private roomHandler: AbstractRoomHandler<AbstractRoom<unknown>>;
    // TODO: http manager
    private httpManager: HttpManager;
    private socketManager: SocketManager;
    constructor(hosts: Hosts, authHandler: AbstractAuthHandler, roomHandler: AbstractRoomHandler<AbstractRoom<unknown>>) {
        this.authHandler = authHandler;
        this.roomHandler = roomHandler;
        this.httpManager = new HttpManager(hosts.http);
        this.socketManager = new SocketManager(hosts.ws, authHandler, roomHandler);
    }
    public async signIn() {
        try {
            const payload = this.authHandler.getAuthRequest();
            const response: HttpAuthResponse = await this.httpManager.signIn(payload);
            this.authHandler.onAuthResponse(response);
        } catch (e) { this.authHandler.onAuthError(e); }
    }
    public async createRoom() {
        try {
            const payload: HttpCreateRoomPayload = { end: `room`, type: `create` };
            (<HttpCreateRoomRequest>payload).extra = this.authHandler.signHttpRequest(payload);
            const response: HttpRoomResponse = await this.httpManager.createRoom(<HttpCreateRoomRequest>payload);
            this.roomHandler.onAssigned(response);
            if (response.success) {
                this.socketManager.connect(response.id);
            }
        } catch (e) {
            throw e;
        }        
    }
    public async joinRoom(id?: string) {
        try {
            const payload: HttpJoinRoomPayload = { end: `room`, type: `join`, id };
            (<HttpJoinRoomRequest>payload).extra = this.authHandler.signHttpRequest(payload);
            const response: HttpRoomResponse = await this.httpManager.joinRoom(<HttpJoinRoomRequest>payload);
            this.roomHandler.onAssigned(response);
            if (response.success) {
                this.socketManager.connect(response.id);
            }
        } catch (e) {
            throw e;
        }
    }
}


// INFO: APPLICATION
type RoomData = {};
type PlayerSyncData = {};
type PlayerPassiveData = {};

class Room extends AbstractRoom<RoomData> {
    public static builder(id: string, state: RoomState) {
        return new Room(id, state, {});
    }
}

class Player extends AbstractPlayer<PlayerSyncData, PlayerPassiveData> {}

class GameAuthHandler extends AbstractAuthHandler {
    getAuthRequest(): HttpAuthRequest { return { end: `auth`, type: `anon` }; } // INFO: conditional. anon/idpw/token/etc
    onAuthResponse(authResponse: HttpAuthResponse) { super.onAuthResponse(authResponse); }
    onAuthError(e: any) {}
    signHttpRequest<T extends HttpPayload>(request: T): any { 
        if (this.extra === undefined) throw new Error(`undefined extra`);
        return this.extra;
    }
    public signWsMessage<T extends SocketMessage>(message: T): any {
        if (this.extra === undefined) throw new Error(`undefined extra`);
        return this.extra;
    }
}

class GameRoomHandler extends AbstractRoomHandler<Room> {
    public onUpdate(type: RoomUpdate, data: any): void {
        throw new Error("Method not implemented.");
    }
    public onGameMessage(json: any): void {
        throw new Error("Method not implemented.");
    }
    public onLeave(): void {
        throw new Error("Method not implemented.");
    }
}


const localAuthHandler = new GameAuthHandler();
const roomHandler = new GameRoomHandler(Room.builder);
const networkEngine = new NetworkEngine({ http: ``, ws: `` }, localAuthHandler, roomHandler);

networkEngine.signIn();

true ? networkEngine.createRoom() : networkEngine.joinRoom();

