export class LocalConfig {
    private static readonly instance: LocalConfig = new LocalConfig();

    public static get get() { return LocalConfig.instance; }
    // INFO: FIELDS 
    private name: string = `player` + (Date.now() % 1000);

        // INFO: maze info
    private maze_width: number = 32;

    private maze_height: number = 18;

    private maze_seed: number = 0;

    // TODO: maybe load from some type of storage
    constructor() { }

    // INFO: GETTERS 
    public get Name() {
        return this.name;
    }

    public get MazeWidth() {
        return this.maze_width;
    }
    
    public get MazeHeight() {
        return this.maze_height;
    }
    
    public get MazeSeed() {
        return this.maze_seed;
    }


    // INFO: SETTERS 
    public set Name(name: string) {
        this.name = name;
    }
    
    public set MazeWidth(maze_width: number) {
        this.maze_width = maze_width;
    }
    
    public set MazeHeight(maze_height: number) {
        this.maze_height = maze_height;
    }
    
    public set MazeSeed(maze_seed: number) {
        this.maze_seed = maze_seed;
    }
}
