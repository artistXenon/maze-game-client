import { getEngine } from "../engine";
import { getMainScene } from "../scenes/main-scene";
import { HttpClient } from "./http-client";
import { LocalClient, Room } from "./states";

export class OnlineSessionHub {
    private static readonly instance = new OnlineSessionHub();

    public static get get() { return OnlineSessionHub.instance; }

    private localClient?: LocalClient;

    private room?: Room;

    private constructor() {
        (<any>window).hub = this;
    }

    public get LocalClient() {
        return this.localClient;
    }

    public get Room() {
        return this.room;
    }

    public async registerClient(): Promise<LocalClient> {
        try {
            // INFO: if client exist, attempt renew, else abandon client
            if (this.localClient !== undefined && (await this.renewClient())) return this.localClient;           
            const res = await HttpClient.get.registerClient();
            if (!res.q) throw new Error(`client register denied.`);
            this.localClient = new LocalClient(res.id, res.s);
            return this.localClient;
        }
        catch (e) {
            throw new Error(`OnlineSessionHub#registerClient: client register failed.\n` + e);
        }
    }

    public unregisterClient(): void {
        this.leaveRoom();
        if (this.localClient !== undefined) {
            const recipe = this.localClient.cookSecret(`:unregister_client:`);
            const [id, secret, rice] = recipe;
            HttpClient.get.unregisterClient(id, secret, rice);
            this.localClient = undefined;
        }
        return;
    }

    private async renewClient(): Promise<boolean> {
        if (this.localClient === undefined) return false;
        const recipe = this.localClient.cookSecret(`:renew_client:`);
        const [id, secret, rice] = recipe;
        const res = await HttpClient.get.extendClientExpiration(id, secret, rice);
        if (!res.q) this.unregisterClient();
        return res.q;
    }

    public async createRoom(): Promise<void> {
        if (this.localClient === undefined) {
            this.localClient = await this.registerClient();
        }
        const localClient = this.localClient;
        const recipe = localClient.cookSecret(`:create_room:`);
        try {
            const [id, secret, rice] = recipe;
            const res = await HttpClient.get.createRoom(id, secret, rice);
            if (!res.q) throw new Error(`OnlineSessionHub#createRoom: room create denied`);
            this.room = new Room(res.id, localClient, true);
            return;
        }
        catch (e) {
            throw new Error(`OnlineSessionHub#createRoom: uncaught error: \n` + e);
        }
    }

    public async joinRoom(room: string): Promise<void> {
        if (this.localClient === undefined) {
            this.localClient = await this.registerClient();
        }
        const localClient = this.localClient;
        const recipe = localClient.cookSecret(`:join_room:`);
        try {
            const [id, secret, rice] = recipe;
            const res = await HttpClient.get.joinRoom(id, secret, rice, room);
            if (!res.q) throw new Error(`OnlineSessionHub#joinRoom: room join denied`);
            this.room = new Room(res.id, localClient, false);
            return;
        }
        catch (e) {
            throw new Error(`OnlineSessionHub#joinRoom: uncaught error: \n` + e);
        }
    }    

    public leaveRoom() {
        this.room?.leave();
        this.room = undefined;
        // TODO: clean up / init for main scene transition
        getEngine().Scene = getMainScene();
    }
}
