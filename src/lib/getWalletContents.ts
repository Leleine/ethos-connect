import { Connection, JsonRpcProvider } from "@mysten/sui.js";
import { SuiNFT, WalletContents } from "../types/WalletContents";
import { newBN, sumBN } from './bigNumber';
import getBagNFT, { isBagNFT } from "./getBagNFT";
// import fetchSui from "./fetchSui";
import { ConvenenienceSuiObject } from '../types/ConvenienceSuiObject';
import { DEFAULT_NETWORK } from './constants';

export const ipfsConversion = (src?: string): string => {
    if (!src) return "";
    if (src.indexOf('ipfs') === 0) {  
        src = `https://ipfs.io/ipfs/${src.substring(5)}`;
    }
    return src;
}

export type GetWalletContentsArgs = {
    address: string,
    network: string,
    existingContents?: WalletContents
}

const empty: WalletContents = {
    suiBalance: newBN(0),
    nfts: [],
    tokens: {},
    objects: []  
}

const getWalletContents = async ({ address, network, existingContents = empty }: GetWalletContentsArgs): Promise<WalletContents | null> => {
    const connection = new Connection({ fullnode: network || DEFAULT_NETWORK })
    const provider = new JsonRpcProvider(connection);

    if (!address) {
        return empty
    }
    
    const objectInfos = await provider.getOwnedObjects({
        owner: address
    });
    if (objectInfos.data.length === 0) {
        return empty;
    }

    const currentObjects = [];
    let newObjectInfos = [];
    if (existingContents?.objects && existingContents.objects.length > 0) {
        for (const objectInfo of objectInfos.data) {
            const existingObject = existingContents?.objects.find(
                (existingObject) => {
                    if (
                        typeof objectInfo.details === "object" &&
                        typeof existingObject.details === "object"
                    ) {
                        return (
                            existingObject.details.objectId === objectInfo.details.objectId &&
                            existingObject.details.version === objectInfo.details.version
                        )    
                    } else {
                        return false;
                    }
                }
            );
            
            if (existingObject) {
                currentObjects.push(existingObject);
            } else {
                newObjectInfos.push(objectInfo);
            }
        }
    } else {
        newObjectInfos = objectInfos.data;
    }

    if (newObjectInfos.length === 0) return null;

    const newObjectIds = newObjectInfos.map((o) => {
        if (typeof o.details === "object") {
            return o.details.objectId
        } else {
            return ""
        }
    }).filter((objectId) => objectId.length > 0);
    
    const newObjects = await provider.multiGetObjects({
        ids: newObjectIds, 
        options: {
            showContent: true,
            showType: true,
            showOwner: true,
            showDisplay: true
        }
    });
    const objects = currentObjects.concat(newObjects);

    let suiBalance = newBN(0);
    const nfts: SuiNFT[] = [];
    const tokens: {[key: string]: any}= {};
    const convenenienceObjects: ConvenenienceSuiObject[] = [];
    for (const object of objects) {
        const { details } = object
        const { content: { fields } } = details;
        try {
            const typeStringComponents = (details.type || "").split('<');
            const subtype = (typeStringComponents[1] || "").replace(/>/, '')
            const typeComponents = typeStringComponents[0].split('::');
            const type = typeComponents[typeComponents.length - 1];

            const { name, description, ...extraFields } = fields || {}
            convenenienceObjects.push({
                ...object,
                type: details?.type,
                version: details?.version,
                objectId: details?.objectId,
                name,
                description,
                extraFields
            })

            if (type === 'DevNetNFT') {
                let { url } = fields;
                let safeUrl = ipfsConversion(url)
                nfts.push({
                    chain: 'Sui',
                    package: '0x2',
                    type,
                    module: 'sui',
                    address: details?.objectId,
                    objectId: details?.objectId,
                    name: fields.name,
                    description: fields.description,
                    imageUri: safeUrl,
                    collection: {
                        name: "DevNetNFT",
                        type: details?.type
                    },
                    links: {
                        'DevNet Explorer': `https://explorer.devnet.sui.io/objects/${details?.objectId}`
                    }
                });
            } else if (type === 'Coin') {
                if (subtype === '0x2::sui::SUI') {
                    suiBalance = sumBN(suiBalance, fields.balance);
                }
                
                tokens[subtype] ||= {
                    balance: 0,
                    coins: []
                }
                
                tokens[subtype].balance = sumBN(tokens[subtype].balance, fields.balance);
                tokens[subtype].coins.push({
                    objectId: details?.objectId,
                    type: details?.type,
                    balance: newBN(fields.balance),
                    digest: details?.digest,
                    version: details?.version
                })
            } else if (isBagNFT(object.details)) {
                const bagNFT = await getBagNFT(provider, object.details);
                
                if ("name" in bagNFT) {
                    nfts.push({
                        type: details?.type,
                        package: typeComponents[0],
                        chain: 'Sui',
                        address: details?.objectId,
                        objectId: details?.objectId,
                        name: bagNFT.name,
                        description: bagNFT.description,
                        imageUri: ipfsConversion(bagNFT.url),
                        module: typeComponents[1],
                        links: {
                            'Explorer': `https://explorer.sui.io/objects/${object?.objectId}`
                        }
                    });       
                }
            } else {
                const { url, image_url, image, ...remaining } = extraFields || {}
                const safeUrl = ipfsConversion(url || image_url || image);
                if (safeUrl) {
                    nfts.push({
                        type: details?.type,
                        package: typeComponents[0],
                        chain: 'Sui',
                        address: details?.objectId,
                        objectId: details?.objectId,
                        name: name,
                        description: description,
                        imageUri: safeUrl,
                        extraFields: remaining,
                        module: typeComponents[1],
                        links: {
                            'Explorer': `https://explorer.sui.io/objects/${object?.objectId}`
                        }
                    });    
                }
            }
        } catch (error) {
            console.log("Error retrieving object", object, error);
        }
    } 

    console.log("convenenienceObjects", convenenienceObjects)
    return { suiBalance, tokens, nfts, objects: convenenienceObjects }
}

export default getWalletContents;