import "./style.css";
import { getEngine } from "./engine";
import { getAssetManager } from "./asset";
import { getMainScene } from "./scenes/main-scene";
import { KeyListener } from "./key-listener";

(async () => {
    const engine = getEngine();
    (<any>window).engine = engine;
    engine.KeyboardGroup.setListener((e) => {
        if (!(engine.Scene.onKey instanceof Function)) return;
        const keyListener = <KeyListener> engine.Scene;
        keyListener.onKey(<KeyboardEvent>e);

    });
    engine.KeyboardGroup.registerEvent();
    const assetManager = getAssetManager();
    assetManager.load("common", false, () => {
        engine.start();
        engine.Scene = getMainScene();
    });
})();