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
  }),
  
  Holder: p.createTable({
    id: p.string(), // wallet address
    address: p.string(),
    balance: p.int(),
    totalMinted: p.int(), // how many they minted (from 0x0)
    lastActivityTime: p.bigint(),
    firstMintTime: p.bigint().optional(),
  }),
}))