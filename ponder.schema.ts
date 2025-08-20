import { createSchema } from "@ponder/core";

export default createSchema((p) => ({
  // Track only mints for live activity feed
  Mint: p.createTable({
    id: p.string(),
    tokenId: p.bigint(),
    to: p.string(),
    timestamp: p.bigint(),
    blockNumber: p.bigint(),
    transactionHash: p.string(),
    collection: p.string(), // HoneyJar1, HoneyJar2, etc.
    chainId: p.int(),
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
    
    // Balances per chain (3 possible chains)
    balanceHomeChain: p.int(), // Balance on home chain (Eth, Arbitrum, Zora, etc.)
    balanceEthereum: p.int(), // Balance on Ethereum (for non-native collections)
    balanceBerachain: p.int(), // Balance on Berachain
    balanceTotal: p.int(), // Total across all chains
    
    // Minted counts per chain
    mintedHomeChain: p.int(), // How many minted on home chain
    mintedEthereum: p.int(), // How many minted/bridged on Ethereum
    mintedBerachain: p.int(), // How many minted on Berachain
    mintedTotal: p.int(), // Total minted across all chains
    
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
  
  // Vault tracking
  Vault: p.createTable({
    id: p.string(), // user + accountIndex
    user: p.string(),
    accountIndex: p.int(),
    honeycombId: p.bigint(),
    isActive: p.boolean(),
    shares: p.bigint(),
    totalBurned: p.int(), // Total HJs burned
    burnedGen1: p.boolean(),
    burnedGen2: p.boolean(),
    burnedGen3: p.boolean(),
    burnedGen4: p.boolean(),
    burnedGen5: p.boolean(),
    burnedGen6: p.boolean(),
    createdAt: p.bigint(),
    closedAt: p.bigint().optional(),
    lastActivityTime: p.bigint(),
  }),
  
  // Vault activity tracking
  VaultActivity: p.createTable({
    id: p.string(),
    user: p.string(),
    accountIndex: p.int(),
    type: p.string(), // "opened", "burned", "claimed", "closed"
    timestamp: p.bigint(),
    blockNumber: p.bigint(),
    transactionHash: p.string(),
    // Type-specific data
    honeycombId: p.bigint().optional(), // For opened/closed
    hjGen: p.int().optional(), // For burned
    shares: p.bigint().optional(), // For shares minted
    reward: p.bigint().optional(), // For claimed
  }),
  
  // User vault summary
  UserVaultSummary: p.createTable({
    id: p.string(), // user address
    user: p.string(),
    totalVaults: p.int(),
    activeVaults: p.int(),
    totalShares: p.bigint(),
    totalRewardsClaimed: p.bigint(),
    totalHJsBurned: p.int(),
    firstVaultTime: p.bigint().optional(),
    lastActivityTime: p.bigint(),
  }),
}))