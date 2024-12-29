import { OnlineSessionHub } from "../../online/session-hub";
import { getMainScene } from "../../scenes/main-scene";
import Button from "../button";

export default class CreateRoomButton extends Button {
    constructor() {
        super("방파기", "red");
    }

    public async onUp(e: PointerEvent): Promise<void> {
        const mainScene = getMainScene();
        try {
            mainScene.enableLoading(true);
            await OnlineSessionHub.get.registerClient();
            await OnlineSessionHub.get.createRoom();
        } catch (e) {
            // TODO: show on screen
            console.error(e);
        } finally {
            mainScene.enableLoading(false);
        }
    }
}
