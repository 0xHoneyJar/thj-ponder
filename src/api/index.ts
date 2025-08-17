import { ponder } from "@/generated";
import { graphql } from "@ponder/core";

// Enable GraphQL endpoint
ponder.use("/graphql", graphql());

ponder.get("/", async (c) => {
  return c.json({ 
    service: "THJ Ponder",
    status: "running",
    port: process.env.PORT || "42069"
  });
});

// Get recent mints with holder info
ponder.get("/transfers/recent", async (c) => {
  try {
    const onlyMints = c.req.query("mints") === "true";
    const limit = parseInt(c.req.query("limit") || "20");
    
    // Build GraphQL query for transfers
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
            transactionHash
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
    
    // Execute GraphQL query internally
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
        txHash: t.transactionHash
      }))
    });
  } catch (error: any) {
    console.error("Error in /transfers/recent:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get top holders leaderboard
ponder.get("/holders", async (c) => {
  try {
    const limit = parseInt(c.req.query("limit") || "10");
    
    // Query holders ordered by balance
    const query = `
      query GetHolders($limit: Int, $orderBy: String, $orderDirection: String, $where: HolderFilter) {
        holders(limit: $limit, orderBy: $orderBy, orderDirection: $orderDirection, where: $where) {
          items {
            id
            address
            balance
            totalMinted
            lastActivityTime
            firstMintTime
          }
        }
      }
    `;
    
    const variables = {
      limit: limit,
      orderBy: "balance",
      orderDirection: "desc",
      where: { balance_gt: 0 } // Only holders with balance > 0
    };
    
    const response = await fetch(`http://localhost:${process.env.PORT || 42069}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables })
    });
    
    const result = await response.json();
    
    if (result.errors) {
      throw new Error(result.errors[0].message);
    }
    
    // Format holder data
    const holders = result.data.holders.items.map((h: any) => ({
      address: h.address,
      balance: h.balance,
      totalReceived: h.balance + h.totalMinted, // Approximation
      totalSent: 0, // Not tracked in simple schema
      lastActivity: Number(h.lastActivityTime)
    }));
    
    return c.json({
      success: true,
      data: holders
    });
  } catch (error: any) {
    console.error("Error in /holders:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get collection stats
ponder.get("/stats", async (c) => {
  try {
    // Query total mints and holder count
    const query = `
      query GetStats {
        transfers(where: { from: "0x0000000000000000000000000000000000000000" }) {
          items {
            id
          }
        }
        holders(where: { balance_gt: 0 }) {
          items {
            id
            balance
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
    
    if (result.errors) {
      throw new Error(result.errors[0].message);
    }
    
    const totalMints = result.data?.transfers?.items?.length || 0;
    const holders = result.data?.holders?.items || [];
    const uniqueHolders = holders.length;
    
    // Get top holders
    const topHolders = holders
      .sort((a: any, b: any) => b.balance - a.balance)
      .slice(0, 10)
      .map((h: any) => ({
        address: h.id,
        balance: h.balance,
        percentage: totalMints > 0 ? (h.balance / totalMints) * 100 : 0
      }));
    
    return c.json({
      success: true,
      data: {
        totalSupply: totalMints,
        uniqueHolders: uniqueHolders,
        totalTransfers: totalMints * 2, // Estimate
        totalMints: totalMints,
        topHolders: topHolders
      }
    });
  } catch (error: any) {
    console.error("Error in /stats:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});