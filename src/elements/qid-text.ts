import { BaseText, InputState } from "./base-text";

export default class QIDText extends BaseText {
    constructor() {
        super(0, 0, 200, 50);
    }

    public beforeTextUpdate(oldState: InputState, newState: InputState): (InputState | void) {
        const { value } = newState;
        const newValue = value.replace(/[^\w]/g, '').substring(0, 4);
        newState.value = newValue;
        return newState;        
    }

}
