// TODO: construction going on.

export class MockWebSocket extends EventTarget implements WebSocket {    
    public readonly CONNECTING = 0;
    public readonly OPEN = 1;
    public readonly CLOSING = 2;
    public readonly CLOSED = 3;

    // WARN: properties may require implementation in future.
    public binaryType: BinaryType = `blob`;
    public bufferedAmount: number = 0; 
    public extensions: string = `MOCK`;
    public protocol: string = `MOCK`;
    public readyState: number;
    public url: string = `MOCK`;

    private openTimeout?: ReturnType<typeof setTimeout>;

    constructor(url: string | URL, protocols?: string | string[], open: boolean = true) {
        super();
        this.readyState = WebSocket.CONNECTING;
        if (open) {
            this.openTimeout = setTimeout(() => {
                const event = new Event(`open`);
                this.onopen?.(event);
                this.dispatchEvent(event);
                this.readyState = WebSocket.OPEN;
            }, 100);
        } else {
            // INFO: dispatch connection failure error
            // TODO: may be timeout? idk
            const event = new Event(`error`);
            this.onerror?.(event);
            this.dispatchEvent(event);
            this.readyState = this.CLOSED;
        }        
    }

    public onopen: ((this: WebSocket, ev: Event) => any) | null = null;
    public onclose: ((this: WebSocket, ev: CloseEvent) => any) | null = null;
    public onerror: ((this: WebSocket, ev: Event) => any) | null = null;
    public onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null = null;

    public close(code?: number, reason?: string): void {
        if (this.openTimeout !== undefined) clearTimeout(this.openTimeout);
        const event = new CloseEvent(`close`, { code, reason });
        this.readyState = WebSocket.CLOSED;
        this.onclose?.(event);
        this.dispatchEvent(event);
    }
    send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
        // TODO: implement
        throw new Error("Method not implemented.");
    }

}