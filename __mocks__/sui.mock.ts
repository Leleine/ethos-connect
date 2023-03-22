import { newBN } from "../src/lib/bigNumber"

const nft = {
    details: {
        type: 'random-address',
        content: {
            fields: {
                url: "IMAGE",
                name: "NAME"
            }
        },
        objectId: 'NFT',
        version: 1
    }
}

const suiCoin = {
    details: {
        type: '0x2::coin::Coin<0x2::sui::SUI>',
        content: {
            fields: {
                balance: newBN(10000)
            }
        },
        objectId: 'COIN1',
        version: 2
    }    
}

const suiCoin2 = {
    details: {
        type: '0x2::coin::Coin<0x2::sui::SUI>',
        content: {
            fields: {
                balance: newBN(5000)
            }
        },
        objectId: 'COIN2',
        version: 6
    }    
}

const suiCoin3 = {
    details: {
        type: '0x2::coin::Coin<0x2::sui::SUI>',
        content: {
            fields: {
                balance: newBN(50000)
            }
        },
        objectId: 'COIN3',
        version: 36
    }    
}

const getOwnedObjects = jest.fn(
    () => Promise.resolve({
        data: [suiCoin, suiCoin2, nft].map((o: any) => ({ 
            details: {
                objectId: o.details.objectId,
                version: o.details.version 
            }
        }))
    })
)

const multiGetObjects = jest.fn(
    ({ ids }: { ids: string[] }) => {
        return [suiCoin, suiCoin2, suiCoin3, nft].filter(
            (o: any) => ids.includes(o.details.objectId)
        )
    }
)

export default {
    suiCoin,
    suiCoin2,
    suiCoin3,
    nft, 
    getOwnedObjects,
    multiGetObjects,
    provider: {
        getOwnedObjects,
        multiGetObjects
    }
}