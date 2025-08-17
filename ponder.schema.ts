import { createSchema } from "@ponder/core";

export default createSchema((p) => ({
  // ============= NFT TOKEN & TRANSFER TRACKING SCHEMA =============
  
  // Individual NFT tokens
  Token: p.createTable({
    id: p.string(), // tokenId as string
    tokenId: p.bigint(),
    currentOwner: p.string().references("Owner.id"),
    mintedBy: p.string(), // Original minter address
    mintTime: p.int(),
    lastTransferTime: p.int(),
    transferCount: p.int(),
  }, {
    ownerIndex: p.index("currentOwner"),
    tokenIdIndex: p.index("tokenId"),
  }),

  // NFT Owners/Holders
  Owner: p.createTable({
    id: p.string(), // wallet address (lowercase)
    address: p.string(),
    balance: p.int(), // Current number of tokens owned
    totalReceived: p.int(), // Total tokens ever received
    totalSent: p.int(), // Total tokens ever sent
    firstActivityTime: p.int(),
    lastActivityTime: p.int(),
  }, {
    balanceIndex: p.index("balance"),
  }),

  // Transfer events (includes mints when from = 0x0)
  TransferEvent: p.createTable({
    id: p.string(), // `${txHash}-${logIndex}`
    tokenId: p.string(),
    from: p.string(),
    to: p.string(),
    isMint: p.boolean(), // true if from = 0x0
    timestamp: p.int(),
    blockNumber: p.int(),
    transactionHash: p.string(),
    logIndex: p.int(),
  }, {
    tokenIdIndex: p.index("tokenId"),
    fromIndex: p.index("from"),
    toIndex: p.index("to"),
    timestampIndex: p.index("timestamp"),
    txHashIndex: p.index("transactionHash"),
  }),

  // Collection Statistics (optional, can be computed from above)
  CollectionStats: p.createTable({
    id: p.string(), // "global" or collection address
    totalSupply: p.int(), // Total minted tokens
    uniqueHolders: p.int(), // Current unique holders
    totalTransfers: p.int(), // Total transfer events
    totalMints: p.int(), // Total mint events
    lastActivityTime: p.int(),
  }),
}))