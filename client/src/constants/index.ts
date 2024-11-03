import manifest from '../../manifest.json'

export const TORII_URL = 'https://t.nsrdm.com'
// export const TORII_URL = 'https://t.nsrdm.com'

export const TORII_RPC_URL = manifest.world.metadata.rpc_url
export const TORII_RELAY_URL = '/ip4/127.0.0.1/udp/9091/webrtc-direct'
export const WORLD_ADDRESS = manifest.world.address
export const TILE_MODEL_TAG = 'flippyflop-Tile'

export const CHUNK_SIZE = 16
export const CHUNKS = 65536 / (CHUNK_SIZE * CHUNK_SIZE)
export const CHUNKS_PER_DIMENSION = Math.sqrt(CHUNKS)
export const WORLD_SIZE = CHUNKS_PER_DIMENSION * CHUNK_SIZE

export const ACTIONS_ADDRESS = manifest.contracts.find((contract) => contract.tag === 'flippyflop-actions')?.address
export const FLIP_ADDRESS = manifest.contracts.find((contract) => contract.tag === 'flippyflop-Flip')?.address
export const CLAIMS_ADDRESS = manifest.contracts.find((contract) => contract.tag === 'flippyflop-game')?.address