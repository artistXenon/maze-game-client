import { coord } from "../helper/types";
import { LocalConfig } from "../states/local-config";

export abstract class AbstractState {
    private isMom: boolean;

    // INFO: game state
    public from: coord = { x: 0, y: 0 };

    public to: coord = { x: 0, y: 0 };

    public since: number = 0;
    // public path: coord[] = [];

    constructor(isMom: boolean) {
        this.isMom = isMom;
    }

    public get IsMom() {
        return this.isMom;
    }

    public initialPosition(index: number) {
        // TODO: include in config
        if (index === 1) {
            this.from.x = LocalConfig.get.MazeWidth - 1;
            this.from.y = 0;
            this.to.x = LocalConfig.get.MazeWidth - 1;
            this.to.y = 0;
        } else if (index === 0) {
            this.from.x = 0;
            this.from.y = LocalConfig.get.MazeHeight - 1;
            this.to.x = 0;
            this.to.y = LocalConfig.get.MazeHeight - 1;
        }
    }

    public sync(from: coord, to: coord, since: number) {
        this.from = from;
        this.to = to;
        this.since = since;
        console.log(`performance now: ${performance.now()}\nreceived since: ${since}`);
    }
}
