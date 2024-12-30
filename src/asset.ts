import { AssetLoader, Bitmap } from "artistic-engine";
// import ~~ from './~~';
// import logg from "/pfp.png";
// import titleLogo from "/image/wg-logo-720p.png";
// import GowunBatang from "/etc/GowunBatang-Regular.woff";

type AssetCart = {
    images?: string[][];
    musics?: string[][];
    sfxs?: string[][];
    fonts?: string[][];
};

const assetMap: Map<string, AssetCart> = new Map()
    .set("common", {
        images: [
            // ["logg", logg],
            // ["title-logo", titleLogo],
        ], // [ name, file?link? ]
        musics: [],
        sfxs: [],
        // fonts: [["GowunBatang", `url(${GowunBatang})`]],
    })
    .set("splash", {
        images: [],
        musics: [],
        sfxs: [],
    });

// asset

class AssetManager {
    private assetLoader: AssetLoader = new AssetLoader();

    private imageBitmaps: Map<string, ImageBitmap> = new Map();

    constructor() {}

    public load(
        category: string,
        withAudio: boolean,
        onLoad: () => void = () => {},
    ) {
        if (!assetMap.has(category))
            throw new Error("No such category of asset: " + category);
        const { images, musics, sfxs, fonts } = <AssetCart>(
            assetMap.get(category)
        );
        if (images) {
            for (const [name, source] of images) {
                this.assetLoader.addImage(name, source);
            }
        }
        if (fonts) {
            for (const [name, source] of fonts) {
                this.assetLoader.addFont(name, source);
            }
        }
        // TODO: list assets

        this.assetLoader.onLoad = () => {
            onLoad();
            this.assetLoader.onLoad = () => {};
        };
        this.assetLoader.load();
    }

    public getImage(name: string): Promise<ImageBitmap> {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (res, rej) => {
            const blob = this.assetLoader.getImage(name);
            if (blob === undefined) {
                return rej(`The image asset ${name} is not loaded.`);
            }
            let imageBitmap = this.imageBitmaps.get(name);
            if (imageBitmap === undefined) {
                imageBitmap = await new Bitmap(blob).getImageBitmap();
                this.imageBitmaps.set(name, imageBitmap);
            }
            return res(imageBitmap);
        });
    }

    public releaseImage(...name: string[]) {
        // TODO: implement to engine assetloader
        throw new Error("not implemented");
    }
}

let instance: AssetManager | undefined;

const getAssetManager = () => {
    if (instance === undefined) {
        instance = new AssetManager();

        // TODO: debugging purpose, remove later
        (<any>window).assetmanager = instance;
    }
    return instance;
};

export { getAssetManager };