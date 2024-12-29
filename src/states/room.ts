import { LocalState } from "./local";
import { RemoteState } from "./remote";


export class Room {
    public RemoteState?: RemoteState;

    public Config?: number;

    public StartTime: number;

    private id: string;

    private local: LocalState;   

    constructor(id: string, isLocalMom: boolean) {
        this.id = id;
        this.local = new LocalState(isLocalMom);
        this.StartTime = 0;
    }

    public get Id() {
        return this.id;
    }

    public get LocalState() {
        return this.local;
    }
}
