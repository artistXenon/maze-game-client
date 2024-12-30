import { coord } from "../../helper/types";
import AbstractState from "./abstract-state";

export default class RemoteState extends AbstractState {

    private id: string;

    private name: string;

    private offset: number = 0;

    constructor(id: string, name: string, isMom: boolean, offset: number) {
        super(isMom);
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
    
    public override sync(from: coord, to: coord, since: number) {
        super.sync(from, to, since + this.offset);
    }
}
