import { AbstractState } from "./abstract-state";

export class LocalState extends AbstractState {
    private isMom: boolean;
    
    constructor(isMom: boolean) {
        super();
        this.isMom = isMom;
    }

    public get IsMom() {
        return this.isMom;
    }
}
