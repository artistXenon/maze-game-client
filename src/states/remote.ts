import { AbstractState } from "./abstract-state";

export class RemoteState extends AbstractState {

    private id: string;
    private name: string;
    private offset: number = 0;


    constructor(id: string, name: string, offset: number) {
        super();
        this.id = id;
        this.name = name;
        this.offset = offset;
    }
    
    public get Id() {
        return this.id;
    }
    
    public get Name() {
        return this.name;
    }
    
    public get Offset() {
        return this.offset;
    }
}
