import { ClientManager } from "../../net/client-manager";
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
            let steps = false;
            steps = await ClientManager.get.registerClient();
            if (!steps) throw new Error(`failed to register client`);
            steps = await ClientManager.get.createRoom();
            if (!steps) throw new Error(`failed to create room`);
            const localClient = ClientManager.get.Client;
            if (localClient === undefined) throw new Error(`undefined LocalClient`);

            ClientManager.get.SocketClient?.knock(localClient.Id, localClient.Name);
        } catch (e) {
            // TODO: show on screen
            console.error(e);
        } finally {
            mainScene.enableLoading(false);
        }
    }
}