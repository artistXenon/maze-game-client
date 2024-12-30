import { Maze } from "../maze";

type dimension = {
    x: number;
    y: number;
    w: number;
    h: number;
};

function mazeDrawer(
    context: CanvasRenderingContext2D, maze: Maze, 
    screen: dimension = { x: 0, y: 0, w: 1920, h: 1080 }
) {
    const { x: mazex, y: mazey, w: width, h: height } = screen;
    const cell_width = width / maze.width, cell_height = height / maze.height;

    const bg = (ctx: CanvasRenderingContext2D, maze: Maze, x: number, y: number, w: number, h: number) => {
        ctx.fillStyle = `grey`;
        ctx.fillRect(x, y, w, h);
    };

    const cell = (ctx: CanvasRenderingContext2D, maze: Maze, x: number, y: number, w: number, h: number) => {

    };

    const point = (ctx: CanvasRenderingContext2D, maze: Maze, x: number, y: number) => {
        // TODO: include in loop below
    };

    const wall = (ctx: CanvasRenderingContext2D, maze: Maze, x: number, y: number, w: number, h: number) => {
        const wall_width = 8;
        ctx.fillStyle = `black`;
        if (w === 0) {
            ctx.fillRect(x - wall_width / 2, y, wall_width, h);
        } else if (h === 0) {
            ctx.fillRect(x, y - wall_width / 2, w, wall_width);
        }
    };

    bg(context, maze, mazex, mazey, width, height);
    for (let x = 0; x < maze.width; x++) {
        let startx = mazex + x * cell_width, endx = startx + cell_width;
        // INFO: top wall
        wall(context, maze, startx, mazey, cell_width, 0); 
        for (let y = 0; y < maze.height; y++) {
            let starty = mazey + y * cell_height, endy = starty + cell_height;
            // INFO: left wall
            if (x === 0) wall(context, maze, mazex, starty, 0, cell_height);

            cell(context, maze, startx, starty, endx, endy);
            if (maze.getWall({ x, y, vertical: true }) !== 0)
                wall(context, maze, endx, starty, 0, cell_height);
            if (maze.getWall({ x, y, vertical: false }) !== 0)
                wall(context, maze, startx, endy, cell_width, 0);
        }
    }
}

export { mazeDrawer };
