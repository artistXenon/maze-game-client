
export class HttpClient {
    public static readonly HOST = `http://creative.jaewon.pro:9882`;
    
    public async registerClient() {
        const res = await fetch(HttpClient.HOST + `/hi`);
        const json = await res.json();
        return json;
    }
    
    public async unregisterClient(id: string, secret: string, rice: string) {
        const res = await fetch(HttpClient.HOST + `/bye?id=${id}&s=${secret}&r=${rice}`);
        const json = await res.json();
        return json;
    }
    
    public async extendClientExpiration(id: string, secret: string, rice: string) {
        const res = await fetch(HttpClient.HOST + `/plz?id=${id}&s=${secret}&r=${rice}`);
        const json = await res.json();
        return json;
    }
    
    public async createRoom(id: string, secret: string, rice: string) {
        const res = await fetch(HttpClient.HOST + `/room?id=${id}&s=${secret}&r=${rice}`);
        const json = await res.json();
        return json;
    }
    
    public async joinRoom(id: string, secret: string, rice: string, room: string) {
        const res = await fetch(HttpClient.HOST + `/room/${room}?id=${id}&s=${secret}&r=${rice}`);
        const json = await res.json();
        return json;
    }
}
