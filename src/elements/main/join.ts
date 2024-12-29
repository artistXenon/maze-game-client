import { ClientManager } from "../../net/client-manager";
import { getMainScene } from "../../scenes/main-scene";
import Button from "../button";
import QIDText from "../qid-text";

export default class JoinRoomButton extends Button {
    private inputRoomId: QIDText;
    constructor(qid: QIDText) {
        super("들어가기", "blue");
        this.inputRoomId = qid;
    }

    public async onUp(e: PointerEvent): Promise<void> {
        const mainScene = getMainScene();
        try {
            mainScene.enableLoading(true);
            let steps = false;
            steps = await ClientManager.get.registerClient();
            if (!steps) throw new Error(`failed to register client`);
            const roomId = this.inputRoomId.Text;
            if (roomId.length === 0) throw new Error(`no id meh`);
            steps = await ClientManager.get.joinRoom(roomId);
            if (!steps) throw new Error(`failed to join room`);
            const localClient = ClientManager.get.Client;
            if (localClient === undefined) throw new Error(`undefined LocalClient`);

            ClientManager.get.SocketClient?.knock(localClient.Id, localClient.Name);
        } catch (e) {
            // TODO: show on screen
            console.error(e);
        } finally {
            mainScene.enableLoading(true);
        }
    }
}