import { createSchema } from "@ponder/core";

export default createSchema((p) => ({
  // ============= SCALABLE NFT COLLECTION SCHEMA =============
  
  // NFT Collection Registry - Add new collections here
  Collection: p.createTable({
    id: p.string(), // contract address
    name: p.string(),
    symbol: p.string().optional(),
    type: p.string(), // "raffle", "auction", "standard"
    totalSupply: p.int(),
    currentSupply: p.int(),
    pricePerUnit: p.bigint(),
    startTime: p.int().optional(),
    endTime: p.int().optional(),
    isActive: p.boolean(),
    metadata: p.json().optional(), // Extra collection-specific data
  }),

  // Generic Mint Entry - Works for any NFT collection
  MintEntry: p.createTable({
    id: p.string(), // `${collection}-${txHash}-${logIndex}`
    collection: p.string().references("Collection.id"),
    buyer: p.string().references("Buyer.id"),
    amount: p.int(), // Number of NFTs/entries
    totalCost: p.bigint(), // Total ETH paid
    pricePerUnit: p.bigint(), // Price per NFT/entry
    timestamp: p.int(),
    blockNumber: p.int(),
    transactionHash: p.string(),
    logIndex: p.int(),
  }, {
    buyerIndex: p.index("buyer"),
    collectionIndex: p.index("collection"),
    timestampIndex: p.index("timestamp"),
    txHashIndex: p.index("transactionHash"),
  }),

  // Buyer Profile - Aggregated across all collections
  Buyer: p.createTable({
    id: p.string(), // wallet address
    totalEntries: p.int(),
    totalSpent: p.bigint(),
    collectionsParticipated: p.int(),
    firstMintTime: p.int(),
    lastMintTime: p.int(),
    rank: p.int().optional(), // Global rank
  }),

  // Collection-specific buyer stats
  CollectionBuyer: p.createTable({
    id: p.string(), // `${collection}-${buyer}`
    collection: p.string().references("Collection.id"),
    buyer: p.string().references("Buyer.id"),
    totalEntries: p.int(),
    totalSpent: p.bigint(),
    firstMintTime: p.int(),
    lastMintTime: p.int(),
    rank: p.int().optional(), // Rank within this collection
  }, {
    collectionBuyerIndex: p.index(["collection", "buyer"]),
    rankIndex: p.index(["collection", "rank"]),
  }),

  // Global Statistics
  GlobalStats: p.createTable({
    id: p.string(), // "global"
    totalCollections: p.int(),
    totalMints: p.int(),
    totalVolume: p.bigint(),
    uniqueBuyers: p.int(),
    lastUpdateTime: p.int(),
  }),

  // Collection-specific Statistics
  CollectionStats: p.createTable({
    id: p.string(), // collection address
    collection: p.string().references("Collection.id"),
    totalMints: p.int(),
    uniqueBuyers: p.int(),
    totalVolume: p.bigint(),
    averageEntrySize: p.float(),
    largestEntry: p.int(),
    lastMintTime: p.int(),
    // Hourly metrics for activity graphs
    mintsLastHour: p.int(),
    volumeLastHour: p.bigint(),
    mintsLast24h: p.int(),
    volumeLast24h: p.bigint(),
  }),

  // Activity feed for real-time updates
  ActivityFeed: p.createTable({
    id: p.string(), // `${timestamp}-${txHash}-${logIndex}`
    collection: p.string().references("Collection.id"),
    buyer: p.string().references("Buyer.id"),
    action: p.string(), // "mint", "transfer", "burn"
    amount: p.int(),
    value: p.bigint(),
    timestamp: p.int(),
    transactionHash: p.string(),
    metadata: p.json().optional(), // Extra event-specific data
  }, {
    timestampIndex: p.index("timestamp"),
    collectionIndex: p.index("collection"),
  }),

  // Leaderboard snapshots (for historical tracking)
  LeaderboardSnapshot: p.createTable({
    id: p.string(), // `${collection}-${timestamp}`
    collection: p.string().references("Collection.id"),
    timestamp: p.int(),
    topBuyers: p.json(), // Array of top 100 buyers with stats
    totalParticipants: p.int(),
    totalVolume: p.bigint(),
  }),
}))