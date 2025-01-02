import { coord } from "../../helper/types";
import { LocalConfig } from "../../states/local-config";
import { GameHandler } from "../game-handler";
import { OnlineSessionHub } from "../session-hub";
import LocalState from "./local-state";

export default abstract class AbstractState {
    private isMom: boolean;

    // INFO: game state
    private goal: coord = { x: 0, y: 0 };

    public from: coord = { x: 0, y: 0 };

    public to: coord = { x: 0, y: 0 };

    public since: number = 0;
    // public path: coord[] = [];

    constructor(isMom: boolean) {
        this.isMom = isMom;
    }

    public get Goal() {
        return this.goal;
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
            this.goal.x = 0;
            this.goal.y = LocalConfig.get.MazeHeight - 1;
        } else if (index === 0) {
            this.from.x = 0;
            this.from.y = LocalConfig.get.MazeHeight - 1;
            this.to.x = 0;
            this.to.y = LocalConfig.get.MazeHeight - 1;
            this.goal.x = LocalConfig.get.MazeWidth - 1;
            this.goal.y = 0;
        }
    }

    public sync(from: coord, to: coord, since: number) {
        this.from = from;
        this.to = to;
        this.since = since;
        // console.log(`performance now: ${performance.now()}\nreceived since: ${since}`);
    }

    public onArrival(gameHandler: GameHandler) {
        const startingCoord = { x: this.to.x, y: this.to.y };
        const { x, y } = this.from;
        let walls = gameHandler.Maze.getSurroundingWalls(startingCoord.x, startingCoord.y);
        // const [ up, down, left, right ] = walls;
        const open = walls.map((a) => <number>(a ? 1 : 0)).reduce((a, b) => a + b);
        const from = 
            y < this.to.y ? `up` :
            y > this.to.y ? `down` :
            x < this.to.x ? `left` :
            x > this.to.x ? `right` : undefined;
        let stop = false;
        if (gameHandler.evaluatePause(this, startingCoord)) {
            stop = true;
            if (this === OnlineSessionHub.get.Room?.LocalState) {
                OnlineSessionHub.get.Room?.SocketClient?.end();
            }
        }
        if (
            open !== 2 || from === undefined
        ) {
            stop = true;
        }
        if (stop) {
            this.from.x = this.to.x;
            this.from.y = this.to.y;
            this.since = performance.now();
            return;
        }
        // TODO: if goal, stop
        let endCoord = { x: startingCoord.x, y: startingCoord.y };
        if (!walls[0] && from !== `up`) {
            do {
                endCoord.y -= 1;
                walls = gameHandler.Maze.getSurroundingWalls(endCoord.x, endCoord.y);
            } while (
                !gameHandler.evaluatePause(this, endCoord) && 
                !walls[0] && walls[2] && walls[3]
            );
        } else if (!walls[1] && from !== `down`) {
            do {
                endCoord.y += 1;
                walls = gameHandler.Maze.getSurroundingWalls(endCoord.x, endCoord.y);
            } while (
                !gameHandler.evaluatePause(this, endCoord) && 
                !walls[1] && walls[2] && walls[3]
            );
        } else if (!walls[2] && from !== `left`) {
            do {
                endCoord.x -= 1;
                walls = gameHandler.Maze.getSurroundingWalls(endCoord.x, endCoord.y);
            } while (
                !gameHandler.evaluatePause(this, endCoord) && 
                walls[0] && walls[1] && !walls[2]
            );
        } else if (!walls[3] && from !== `right`) {
            do {
                endCoord.x += 1;
                walls = gameHandler.Maze.getSurroundingWalls(endCoord.x, endCoord.y);
            } while (
                !gameHandler.evaluatePause(this, endCoord) && 
                walls[0] && walls[1] && !walls[3]
            );
        }
        this.since = performance.now();
        this.from.x = this.to.x;
        this.from.y = this.to.y;
        this.to.x = endCoord.x;
        this.to.y = endCoord.y;
    }
}
