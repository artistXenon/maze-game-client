import { coord } from "../helper/types";

export abstract class AbstractState {
    // INFO: game state
    public from: coord = { x: 0, y: 0 };
    public to: coord = { x: 0, y: 0 };;
    public since: number = 0;
    // public path: coord[] = [];



    public initialPosition(index: number, size: { w: number, h: number }) {
        // TODO: include in config
        if (index === 1) {
            this.from.x = size.w - 1;
            this.from.y = 0;
            this.to.x = size.w - 1;
            this.to.y = 0;
        } else if (index === 0) {
            this.from.x = 0;
            this.from.y = size.h - 1;
            this.to.x = 0;
            this.to.y = size.h - 1;
        }
    }

    public sync(from: coord, to: coord, since: number) {
        this.from = from;
        this.to = to;
        this.since = since;
        console.log(`performance now: ${performance.now()}\nreceived since: ${since}`);
    }
}
