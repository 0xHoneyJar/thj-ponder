import { createSchema } from "@ponder/core";

export default createSchema((p) => ({
  Transfer: p.createTable({
    id: p.string(),
    tokenId: p.bigint(),
    from: p.string(),
    to: p.string(),
    timestamp: p.bigint(),
    blockNumber: p.bigint(),
    transactionHash: p.string(),
    collection: p.string(), // HoneyJar1, HoneyJar2, etc.
    chainId: p.int(), // Chain ID for the transfer
  }),
  
  Holder: p.createTable({
    id: p.string(), // wallet address + collection
    address: p.string(),
    balance: p.int(),
    totalMinted: p.int(), // how many they minted (from 0x0)
    lastActivityTime: p.bigint(),
    firstMintTime: p.bigint().optional(),
    collection: p.string(), // HoneyJar1, HoneyJar2, etc.
    chainId: p.int(), // Chain ID for the holder
  }),
  
  CollectionStats: p.createTable({
    id: p.string(), // collection name (e.g., "HoneyJar1")
    collection: p.string(),
    totalSupply: p.int(), // Total number of NFTs minted
    uniqueHolders: p.int(), // Number of unique holders
    lastMintTime: p.bigint().optional(),
    chainId: p.int(),
  }),
}))