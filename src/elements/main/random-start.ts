import Button from "../button";

export default class RandomStartButton extends Button {
    constructor() {
        super("매칭 시작", "blue");
    }

    public onUp(e: PointerEvent): void {
        console.log("not implemented");
    }
}