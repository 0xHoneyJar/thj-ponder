import { ponder } from "@/generated";

ponder.get("/", async (c) => {
  return c.json({ 
    service: "THJ Ponder",
    status: "running",
    port: process.env.PORT || "42069"
  });
});

ponder.get("/transfers", async (c) => {
  const { Transfer } = c.db;
  const transfers = await Transfer.findMany({
    orderBy: { timestamp: "desc" },
    limit: 100,
  });
  return c.json(transfers);
});

ponder.get("/mints", async (c) => {
  const { Transfer } = c.db;
  const mints = await Transfer.findMany({
    where: { from: "0x0000000000000000000000000000000000000000" },
    orderBy: { timestamp: "desc" },
    limit: 100,
  });
  return c.json(mints);
});

// API endpoint that Hub interface expects
ponder.get("/transfers/recent", async (c) => {
  try {
    const { Transfer } = c.db;
    const onlyMints = c.req.query("mints") === "true";
    const limit = parseInt(c.req.query("limit") || "20");
    
    const transfers = await Transfer.findMany({
      where: onlyMints ? { from: "0x0000000000000000000000000000000000000000" } : {},
      orderBy: { timestamp: "desc" },
      limit: limit,
    });
    
    // Format for Hub interface
    return c.json({
      success: true,
      data: transfers.map(t => ({
        tokenId: String(t.tokenId),
        from: t.from,
        to: t.to,
        isMint: t.from === "0x0000000000000000000000000000000000000000",
        timestamp: Number(t.timestamp),
        blockNumber: Number(t.blockNumber),
        txHash: t.id.split('-')[0] // Extract tx hash from id
      }))
    });
  } catch (error) {
    console.error("Error in /transfers/recent:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Holders endpoint (aggregate from transfers)
ponder.get("/holders", async (c) => {
  try {
    const { Transfer } = c.db;
    const limit = parseInt(c.req.query("limit") || "10");
    
    // Get all transfers to build holder balances
    const allTransfers = await Transfer.findMany({
      orderBy: { timestamp: "asc" }
    });
    
    // Build holder balances
    const balances = new Map();
    
    for (const transfer of allTransfers) {
      const from = transfer.from;
      const to = transfer.to;
      
      // Decrease from balance (unless it's a mint)
      if (from !== "0x0000000000000000000000000000000000000000") {
        const currentBalance = balances.get(from) || 0;
        balances.set(from, Math.max(0, currentBalance - 1));
      }
      
      // Increase to balance
      const currentBalance = balances.get(to) || 0;
      balances.set(to, currentBalance + 1);
    }
    
    // Sort by balance and get top holders
    const holders = Array.from(balances.entries())
      .filter(([_, balance]) => balance > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([address, balance]) => ({
        address,
        balance,
        totalReceived: balance, // Simplified
        totalSent: 0, // Simplified
        lastActivity: Math.floor(Date.now() / 1000)
      }));
    
    return c.json({
      success: true,
      data: holders
    });
  } catch (error) {
    console.error("Error in /holders:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Stats endpoint
ponder.get("/stats", async (c) => {
  try {
    const { Transfer } = c.db;
    
    // Get all transfers
    const allTransfers = await Transfer.findMany();
    
    // Count mints
    const mints = allTransfers.filter(t => 
      t.from === "0x0000000000000000000000000000000000000000"
    );
    
    // Build unique holders
    const uniqueHolders = new Set();
    const balances = new Map();
    
    for (const transfer of allTransfers) {
      const from = transfer.from;
      const to = transfer.to;
      
      // Track balance changes
      if (from !== "0x0000000000000000000000000000000000000000") {
        const currentBalance = balances.get(from) || 0;
        balances.set(from, Math.max(0, currentBalance - 1));
      }
      
      const currentBalance = balances.get(to) || 0;
      balances.set(to, currentBalance + 1);
      
      if (balances.get(to) > 0) {
        uniqueHolders.add(to);
      }
      if (balances.get(from) === 0) {
        uniqueHolders.delete(from);
      }
    }
    
    // Get top holders
    const topHolders = Array.from(balances.entries())
      .filter(([_, balance]) => balance > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([address, balance]) => ({
        address,
        balance,
        percentage: (balance / mints.length) * 100
      }));
    
    return c.json({
      success: true,
      data: {
        totalSupply: mints.length,
        uniqueHolders: uniqueHolders.size,
        totalTransfers: allTransfers.length - mints.length,
        totalMints: mints.length,
        topHolders
      }
    });
  } catch (error) {
    console.error("Error in /stats:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});