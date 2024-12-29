import { Engine, FontBuilder } from "artistic-engine";
import { KeyboardEventGroup, PointerEventGroup } from "artistic-engine/event";

export class CustomEngine extends Engine {
    public KeyboardGroup: KeyboardEventGroup;

    public PointerGroup: PointerEventGroup;

    private fontBuilderMap: Map<string, FontBuilder>;

    constructor() {
        super("#main");
        this.KeyboardGroup = new KeyboardEventGroup(document.body);
        this.PointerGroup = new PointerEventGroup(this);
        this.PointerGroup.setListenSequenceFirstInFirstTrigger(false);
        this.fontBuilderMap = new Map();
        this.PointerGroup.registerEvent();
    }

    public getFontBuilder(name: string) {
        if (this.fontBuilderMap.has(name)) {
            return this.fontBuilderMap.get(name);
        }
        const fontbuilder = new FontBuilder(name);
        this.fontBuilderMap.set(name, fontbuilder);
        return fontbuilder;
    }
}

let engine: CustomEngine;
const getEngine: () => CustomEngine = () => {
    if (engine === undefined) {
        engine = new CustomEngine();
        const resolution = { X: 1920, Y: 1080};

        // resolution
        const fitScreen = () => {
            const fitWidth = resolution.X * innerHeight > resolution.Y * innerWidth;
            engine.resizeCanvas(
            fitWidth ? {
                W: innerWidth,
                H: (innerWidth * resolution.Y) / resolution.X,
            } : {
                W: (innerHeight * resolution.X) / resolution.Y,
                H: innerHeight,
            });
            engine.Camera.reset();
            engine.Camera.scale(
                fitWidth
                    ? innerWidth / resolution.X
                    : innerHeight / resolution.Y,
            );
        };
        fitScreen();
        addEventListener("resize", fitScreen);
    }
    return engine;
};

export { getEngine };
