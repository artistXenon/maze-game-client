import { getGameScene } from "../scenes/game-scene";
import { Room } from "../states/room";
import { ClientManager } from "./client-manager";
import { LocalClient } from "./local-client";

type hi_message = { t: `hi`; r: string; s: string; };

export interface ISocketListener {
    // TODO: for game.
    onClose(e: CloseEvent | Error): void;
    onReady(isMom: Room): void;
    onStart(plannedBalls: number, plannedConfig: number, positionIndex: number): void;
    onOpponent(id: string, name: string, offset: number): void;
    onGameMsg(msg: any): void;
}

export class SocketClient {
    public static readonly HOST = `ws://creative.jaewon.pro:9883`;

    public static async create(roomId: string, local: LocalClient, secret: string, rice: string, listener: ISocketListener) {
        return new Promise<SocketClient>((resolve) => {
            new SocketClient(roomId, local, { t: `hi`, r: rice, s: secret }, 
                resolve, listener);
        })
    }

    private socketListener: ISocketListener;

    private connection: WebSocket;

    private gameReady: number = 0;

    private constructor(
        roomId: string, localClient: LocalClient, hi_msg: hi_message, 
        onReady: (result: SocketClient) => any, listener: ISocketListener
    ) {
        this.socketListener = listener;
        const instance = this;
        const ws = new WebSocket(SocketClient.HOST + '/' + roomId + '/' + localClient.Id);
        ws.addEventListener('open', () => ws.send(JSON.stringify(hi_msg)));    
        ws.addEventListener('error', console.error);
        ws.addEventListener('close', (e) => instance.socketListener.onClose(e));    
        ws.addEventListener('message', (event: MessageEvent) => {
            try {
                const json = JSON.parse(event.data.toString());
                if (this.gameReady === 0) {
                    switch (json.t) {
                        case `time`:
                            const { l, c } = json;
                            const now = performance.now();
                            ws.send(JSON.stringify({
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
                            onReady(this);
                            this.socketListener.onReady(new Room(roomId, m));
                            break;
                        default: 
                        // WARN: meh? should never happen
                    }
                }
                if (json.t === `knock`) {
                    if ((this.gameReady & 0b10101) !== 0b00101) return;
                    const { id, n, o } = json;
                    this.socketListener.onOpponent(id, n, o);
                    this.gameReady = 0b01111;
                    // INFO: why did I name it balls?
                    // INFO: In Asian culture, the instrument often used openning a fight is called gong, which can be translated into a ball in Korean.
                    // INFO: ...and, you've been knocking for a while. What do you expect other than a good fxxking Ligma :D
                    const plannedBalls = performance.now() + 1000 * 7;
                    const plannedConfig = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);                    
                    const localPositionIndex = Math.round(Math.random());
                    // INFO: if mom, start game with ball and config
                    const room = ClientManager.get.Room;
                    if (room === undefined) throw new Error(`SocketClient#onMessage$knock: undefined room.`);
                    if (!room.LocalState.IsMom) return;
                    this.send({
                        t: `balls`,
                        p: plannedBalls,
                        c: plannedConfig,
                        pi: 1 - localPositionIndex
                    });
                    // INFO: start game with ball and config
                    this.gameReady = 0b11111;
                    this.socketListener.onStart(plannedBalls, plannedConfig, localPositionIndex);
                    return;
                }
                if (json.t === `balls`) {
                    const room = ClientManager.get.Room;
                    if (room === undefined) throw new Error(`SocketClient#onMessage$balls: undefined room.`);
                    if ((this.gameReady & 0b10101) !== 0b00101 || room.LocalState.IsMom) return;
                    const remote = room.RemoteState;
                    if (remote === undefined) throw new Error(`SocketClient#onMessage$balls: undefined remote.`);

                    const { p, c, pi } = json;
                    const offset = remote.Offset;
                    if (offset === undefined) throw new Error(`SocketClient#onMessage$balls: undefined offset.`);
                    const plannedBalls = p + offset;
                    const plannedConfig = c;
                    // INFO: start game with ball and config
                    this.gameReady = 0b11111;
                    this.socketListener.onStart(plannedBalls, plannedConfig, pi);
                }
                if (this.gameReady !== 0b11111) return;
                this.socketListener.onGameMsg(json);

            } catch (e) {
                if (e instanceof SyntaxError) {
                    // INFO: wrong json
                }
                console.error(e);
                // WARN: possibly not error
                this.socketListener.onClose(<Error>e);
            }
            // TODO: to json, to interface.
        });

        this.connection = ws;
    }

    public knock(id: string, name: string) {
        this.gameReady |= 0b00101;
        const interval = setInterval(() => {
            if ((this.gameReady & 0b10101) !== 0b00101) return clearInterval(interval);

            this.send({ t: `knock`, n: name });
        }, 3000);
    }

    public send(msg: any) {
        this.connection.send(JSON.stringify(msg));
    }

    public destroy() {
        this.gameReady = 0;
        if (this.connection.readyState > 1) return;
        this.send({ t: `bye` });
        this.connection.close();
        (<any>this).socketListener = undefined;
    }
}
