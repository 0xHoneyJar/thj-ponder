import { createSchema } from "@ponder/core";

export default createSchema((p) => ({
  Transfer: p.createTable({
    id: p.string(),
    tokenId: p.bigint(),
    from: p.string(),
    to: p.string(),
    timestamp: p.bigint(),
    blockNumber: p.bigint(),
  }),
}))