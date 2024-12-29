import { OnlineSessionHub } from "../../online/session-hub";
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
            await OnlineSessionHub.get.registerClient();
            const roomId = this.inputRoomId.Text;
            if (roomId.length === 0) throw new Error(`JoinRoomButton#onUp: no id provided`);
            await OnlineSessionHub.get.joinRoom(roomId);
        } catch (e) {
            // TODO: show on screen
            console.error(e);
        } finally {
            mainScene.enableLoading(false);
        }
    }
}
