import { LocalConfig } from "../states/local-config";
import { LocalClient } from "./local-client";
import { OnlineSessionHub } from "./session-hub";

export interface ISocketListener {
    onOpen(): void;
    onUpdate(type: string, args?: any): void;
    onGameMessage(args: any): void;
    onClose(reason: any): void;
}

export class SocketClient {
    public static readonly HOST = `ws://creative.jaewon.pro:9883`;

    public static create(roomId: string, localClient: LocalClient, socketListener: ISocketListener) {
        const [_, s, r] = localClient.cookSecret(`:socket_join:`);

        const websocket = new WebSocket(SocketClient.HOST + '/' + roomId + '/' + localClient.Id);
        websocket.addEventListener('open', () => websocket.send(JSON.stringify({ t: `hi`, r, s })));    

        return new SocketClient(websocket, socketListener);    
    }

    private gameReady: number = 0;

    private websocket: WebSocket;

    private socketListener: ISocketListener;

    constructor(websocket: WebSocket, socketListener: ISocketListener) {
        this.socketListener = socketListener;
        this.websocket = websocket;
        websocket.addEventListener('error', console.error);
        websocket.addEventListener('close', (e) => this.socketListener.onClose(e));    
        websocket.addEventListener('message', (event: MessageEvent) => {
            try {
                const room = OnlineSessionHub.get.Room;
                if (room === undefined) throw new Error(`SocketClient#constructor$message: undefined Room.`);
                const json = JSON.parse(event.data.toString());
                if (this.gameReady === 0) {
                    switch (json.t) {
                        case `time`:
                            const { l, c } = json;
                            const now = performance.now();
                            websocket.send(JSON.stringify({
                                t: 'time',
                                l: now,
                                d: now - l,
                                c
                            }));
                            break;
                        case `ready`:
                            const { s, o, m } = json;
                            if (s) this.gameReady |= 0b00001;
                            if (o) this.gameReady |= 0b00010;
                            this.socketListener.onUpdate(`ready`, { isMoM: m });
                            break;
                        default: 
                            // throw new Error(`SocketClient#constructor$time: should never happen.`);
                            return;
                    }
                }
                if (json.t === `knock`) {
                    if ((this.gameReady & 0b10101) !== 0b00101) return;
                    // INFO: user: { id, name, offset }
                    const { id, n, o } = json;
                    this.socketListener.onUpdate(`opponent-join`, { id, name: n, offset: o });
                    this.gameReady = 0b01111;
                    if (!room.LocalState.IsMom) return;
                    // INFO: why did I name it balls?
                    // INFO: In Asian culture, the instrument often used openning a fight is called gong, which can be translated into a ball in Korean.
                    // INFO: ...and, you've been knocking for a while. What do you expect other than a good fxxking Ligma :D
                    const plannedBalls = performance.now() + 1000 * 7;
                    const plannedConfig = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);                    
                    const localPositionIndex = Math.round(Math.random());
                    this.send({
                        t: `balls`,
                        p: plannedBalls,
                        c: plannedConfig,
                        pi: 1 - localPositionIndex
                    });
                    // INFO: start game with ball and config
                    this.gameReady = 0b11111;
                    this.socketListener.onUpdate(`start`, {
                        config: plannedConfig,
                        startTime: plannedBalls, 
                        positionIndex: localPositionIndex
                    });
                    return;
                }
                if (json.t === `balls`) {
                    if ((this.gameReady & 0b11111) !== 0b01111 || room.LocalState.IsMom) return;
                    const remote = room.RemoteState;
                    if (remote === undefined) throw new Error(`SocketClient#onMessage$balls: undefined remote.`);
                    const { p, c, pi } = json;
                    const offset = remote.Offset;
                    if (offset === undefined) throw new Error(`SocketClient#onMessage$balls: undefined offset.`);
                    const plannedBalls = p + offset;
                    const plannedConfig = c;
                    // INFO: start game with ball and config
                    this.gameReady = 0b11111;
                    this.socketListener.onUpdate(`start`, {
                        config: plannedConfig,
                        startTime: plannedBalls, 
                        positionIndex: pi
                    });
                }
                if (this.gameReady !== 0b11111) return;
                this.socketListener.onGameMessage(json);

            } catch (e) {
                // if (e instanceof SyntaxError) {
                //     // INFO: wrong json
                // }
                this.socketListener.onClose(e);
            }
            // TODO: to json, to interface.
        });
    }

    public knock() {
        this.gameReady |= 0b00101;
        const interval = setInterval(() => {
            if ((this.gameReady & 0b10101) !== 0b00101) return clearInterval(interval);

            this.send({ t: `knock`, n: LocalConfig.get.Name });
        }, 1000);
    }

    public end() {
        // TODO: match over
        // TODO: verified end will be handled after response.
        // TODO: so here, we just pause all inputs and wait
        this.send({
            t: `end`, 
            n: performance.now()
        });
    }

    public send(msg: any) {
        this.websocket.send(JSON.stringify(msg));
    }

    public destroy() {
        this.gameReady = 0;
        if (this.websocket.readyState > 1) return;
        this.send({ t: `bye` });
        this.websocket.close();
    }
}
