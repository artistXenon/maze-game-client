import { sha1 } from "js-sha1";

export default class LocalClient {
    private static readonly TABLE = `abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789`;

    private id: string;

    private secret: string;

    constructor(id: string, secret: string) {
        this.id = id;
        this.secret = secret;
    }

    public get Id() {
        return this.id;
    }

    public cookSecret(dest: string): [string, string, string] {
        let rice = ``;
        for (let i = 0; i < 8; i++) {
            rice += LocalClient.TABLE[Math.floor(LocalClient.TABLE.length * Math.random())];
        }
        const secret = sha1(this.secret + dest + rice);
        return [this.id, secret, rice];
    }
}
