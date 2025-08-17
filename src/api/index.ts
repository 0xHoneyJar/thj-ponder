import { ponder } from "@/generated";
import { graphql } from "@ponder/core";

// ============= REST API ENDPOINTS =============

// GET /api/health - Health check endpoint for Railway
ponder.get("/api/health", async (c) => {
  return c.json({ 
    status: "healthy",
    service: "thj-ponder",
    timestamp: Date.now()
  });
});

// GET /api/tokens/:tokenId - Get specific token info
ponder.get("/api/tokens/:tokenId", async (c) => {
  const { Token, TransferEvent } = c.db;
  
  const tokenId = c.req.param("tokenId");
  const token = await Token.findUnique({ id: tokenId });
  
  if (!token) {
    return c.json({ 
      success: false, 
      error: "Token not found" 
    }, 404);
  }

  // Get transfer history
  const transfers = await TransferEvent.findMany({
    where: { tokenId: tokenId },
    orderBy: { timestamp: "desc" },
    limit: 10,
  });

  return c.json({
    success: true,
    data: {
      tokenId: token.tokenId.toString(),
      currentOwner: token.currentOwner,
      mintedBy: token.mintedBy,
      mintTime: token.mintTime,
      lastTransferTime: token.lastTransferTime,
      transferCount: token.transferCount,
      transferHistory: transfers.map(t => ({
        from: t.from,
        to: t.to,
        isMint: t.isMint,
        timestamp: t.timestamp,
        txHash: t.transactionHash,
      })),
    },
  });
});

// GET /api/owners/:address - Get owner info and holdings
ponder.get("/api/owners/:address", async (c) => {
  const { Owner, Token } = c.db;
  
  const address = c.req.param("address").toLowerCase();
  const owner = await Owner.findUnique({ id: address });
  
  if (!owner) {
    return c.json({ 
      success: false, 
      error: "Owner not found" 
    }, 404);
  }

  // Get owned tokens
  const ownedTokens = await Token.findMany({
    where: { currentOwner: address },
    orderBy: { tokenId: "asc" },
    limit: 100,
  });

  return c.json({
    success: true,
    data: {
      address: owner.address,
      balance: owner.balance,
      totalReceived: owner.totalReceived,
      totalSent: owner.totalSent,
      firstActivityTime: owner.firstActivityTime,
      lastActivityTime: owner.lastActivityTime,
      tokenIds: ownedTokens.map(t => t.tokenId.toString()),
    },
  });
});

// GET /api/transfers/recent - Get recent transfer activity
ponder.get("/api/transfers/recent", async (c) => {
  const { TransferEvent } = c.db;
  
  const limit = parseInt(c.req.query("limit") || "50");
  const onlyMints = c.req.query("mints") === "true";
  
  const whereClause = onlyMints ? { isMint: true } : {};
  
  const recentTransfers = await TransferEvent.findMany({
    where: whereClause,
    orderBy: { timestamp: "desc" },
    limit: limit,
  });

  return c.json({ 
    success: true,
    data: recentTransfers.map(t => ({
      tokenId: t.tokenId,
      from: t.from,
      to: t.to,
      isMint: t.isMint,
      timestamp: t.timestamp,
      blockNumber: t.blockNumber,
      txHash: t.transactionHash,
    }))
  });
});

// GET /api/stats - Get collection statistics
ponder.get("/api/stats", async (c) => {
  const { Token, Owner, TransferEvent, CollectionStats } = c.db;
  
  // Get basic counts
  const totalTokens = await Token.findMany();
  const totalOwners = await Owner.findMany();
  const totalTransfers = await TransferEvent.findMany();
  
  const mints = totalTransfers.filter(t => t.isMint);
  const transfers = totalTransfers.filter(t => !t.isMint);
  
  // Get top holders
  const topHolders = await Owner.findMany({
    orderBy: { balance: "desc" },
    limit: 10,
  });

  return c.json({
    success: true,
    data: {
      totalSupply: totalTokens.length,
      uniqueHolders: totalOwners.filter(o => o.balance > 0).length,
      totalTransfers: transfers.length,
      totalMints: mints.length,
      topHolders: topHolders.map(h => ({
        address: h.address,
        balance: h.balance,
        percentage: (h.balance / totalTokens.length) * 100,
      })),
    },
  });
});

// GET /api/holders - Get all token holders
ponder.get("/api/holders", async (c) => {
  const { Owner } = c.db;
  
  const minBalance = parseInt(c.req.query("minBalance") || "1");
  const limit = parseInt(c.req.query("limit") || "100");
  
  const holders = await Owner.findMany({
    where: { balance: { gte: minBalance } },
    orderBy: { balance: "desc" },
    limit: limit,
  });

  return c.json({
    success: true,
    data: holders.map(h => ({
      address: h.address,
      balance: h.balance,
      totalReceived: h.totalReceived,
      totalSent: h.totalSent,
      lastActivity: h.lastActivityTime,
    })),
  });
});

// ============= GRAPHQL API (Optional) =============
ponder.use("/graphql", graphql());