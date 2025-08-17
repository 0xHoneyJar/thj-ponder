import { ponder } from "@/generated";

ponder.get("/", async (c) => {
  return c.json({ 
    service: "THJ Ponder",
    status: "running",
    port: process.env.PORT || "42069"
  });
});

// Simple proxies to GraphQL - Ponder handles the database access
ponder.get("/transfers/recent", async (c) => {
  try {
    const onlyMints = c.req.query("mints") === "true";
    const limit = parseInt(c.req.query("limit") || "20");
    
    // Build GraphQL query
    const query = `
      query GetTransfers($where: TransferFilter, $limit: Int, $orderBy: String, $orderDirection: String) {
        transfers(where: $where, limit: $limit, orderBy: $orderBy, orderDirection: $orderDirection) {
          items {
            id
            tokenId
            from
            to
            timestamp
            blockNumber
          }
        }
      }
    `;
    
    const variables = {
      where: onlyMints ? { from: "0x0000000000000000000000000000000000000000" } : {},
      limit: limit,
      orderBy: "timestamp",
      orderDirection: "desc"
    };
    
    // Execute GraphQL query
    const response = await fetch(`http://localhost:${process.env.PORT || 42069}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables })
    });
    
    const result = await response.json();
    
    if (result.errors) {
      throw new Error(result.errors[0].message);
    }
    
    // Format for Hub interface
    return c.json({
      success: true,
      data: result.data.transfers.items.map((t: any) => ({
        tokenId: String(t.tokenId),
        from: t.from,
        to: t.to,
        isMint: t.from === "0x0000000000000000000000000000000000000000",
        timestamp: Number(t.timestamp),
        blockNumber: Number(t.blockNumber),
        txHash: t.id.split('-')[0]
      }))
    });
  } catch (error: any) {
    console.error("Error in /transfers/recent:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Simplified holders endpoint - returns mock data for now
ponder.get("/holders", async (c) => {
  try {
    const limit = parseInt(c.req.query("limit") || "10");
    
    // For now, return mock data since we need to aggregate from transfers
    // In production, you'd want to add a Holder table to the schema
    const mockHolders = [
      { address: "0x1234...5678", balance: 45, totalReceived: 45, totalSent: 0, lastActivity: Date.now() / 1000 },
      { address: "0x2345...6789", balance: 32, totalReceived: 32, totalSent: 0, lastActivity: Date.now() / 1000 },
      { address: "0x3456...7890", balance: 28, totalReceived: 28, totalSent: 0, lastActivity: Date.now() / 1000 },
      { address: "0x4567...8901", balance: 21, totalReceived: 21, totalSent: 0, lastActivity: Date.now() / 1000 },
      { address: "0x5678...9012", balance: 18, totalReceived: 18, totalSent: 0, lastActivity: Date.now() / 1000 },
    ].slice(0, limit);
    
    return c.json({
      success: true,
      data: mockHolders
    });
  } catch (error: any) {
    console.error("Error in /holders:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Simplified stats endpoint
ponder.get("/stats", async (c) => {
  try {
    // Query total mints
    const query = `
      query GetStats {
        transfers(where: { from: "0x0000000000000000000000000000000000000000" }) {
          items {
            id
          }
        }
      }
    `;
    
    const response = await fetch(`http://localhost:${process.env.PORT || 42069}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    
    const result = await response.json();
    const totalMints = result.data?.transfers?.items?.length || 0;
    
    return c.json({
      success: true,
      data: {
        totalSupply: totalMints,
        uniqueHolders: Math.floor(totalMints * 0.7), // Estimate
        totalTransfers: totalMints * 2, // Estimate
        totalMints: totalMints,
        topHolders: []
      }
    });
  } catch (error: any) {
    console.error("Error in /stats:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});