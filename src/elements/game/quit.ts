import { OnlineSessionHub } from "../../online/session-hub";
import Button from "../button";

export default class QuitButton extends Button {
    constructor() {
        super("나가기", "orange");
    }

    public async onUp(e: PointerEvent): Promise<void> {
        // TODO: later - confirm leave
        OnlineSessionHub.get.leaveRoom();
    }
}
