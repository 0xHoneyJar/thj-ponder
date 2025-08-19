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
    id: p.string(), // wallet address + collection + chainId
    address: p.string(),
    balance: p.int(),
    totalMinted: p.int(), // how many they minted (from 0x0)
    lastActivityTime: p.bigint(),
    firstMintTime: p.bigint().optional(),
    collection: p.string(), // HoneyJar1, HoneyJar2, etc.
    chainId: p.int(), // Chain ID for the holder
  }),
  
  // New table to track user's total balances across chains
  UserBalance: p.createTable({
    id: p.string(), // wallet address + generation (e.g., "0x123...abc-gen1")
    address: p.string(),
    generation: p.int(), // 1-6 for HoneyJar generations, 0 for Honeycomb
    
    // Balances per chain
    balanceHomeChain: p.int(), // Balance on home chain (Eth, Arbitrum, Zora, etc.)
    balanceBerachain: p.int(), // Balance on Berachain
    balanceTotal: p.int(), // Total across both chains
    
    // Minted counts per chain
    mintedHomeChain: p.int(), // How many minted on home chain
    mintedBerachain: p.int(), // How many minted on Berachain
    mintedTotal: p.int(), // Total minted across both chains
    
    lastActivityTime: p.bigint(),
    firstMintTime: p.bigint().optional(),
  }),
  
  CollectionStat: p.createTable({
    id: p.string(), // collection name + chainId (e.g., "HoneyJar1-1")
    collection: p.string(),
    totalSupply: p.int(), // Total number of NFTs minted
    uniqueHolders: p.int(), // Number of unique holders
    lastMintTime: p.bigint().optional(),
    chainId: p.int(),
  }),
}))