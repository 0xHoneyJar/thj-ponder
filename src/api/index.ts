import { ponder } from "@/generated";
import { graphql } from "@ponder/core";

// Enable GraphQL endpoint
ponder.use("/graphql", graphql());

ponder.get("/", async (c) => {
  return c.json({
    service: "THJ Ponder",
    status: "running",
    port: process.env.PORT || "42069",
    endpoints: {
      graphql: "/graphql",
      userBalance: "/user/:address",
      userBalanceByGen: "/user/:address/gen/:generation",
      holders: "/holders/:collection/:chainId",
      stats: "/stats/:collection/:chainId",
      transfers: "/transfers/recent",
    },
  });
});

// Get user balance across all generations
ponder.get("/user/:address", async (c) => {
  try {
    const address = c.req.param("address").toLowerCase();

    // For now, return structure - actual DB query would go here
    return c.json({
      success: true,
      address: address,
      data: {
        totalJars: 0,
        totalMinted: 0,
        generations: [],
        message: "Use GraphQL endpoint at /graphql for live data",
      },
    });
  } catch (error: any) {
    console.error("Error in /user/:address:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get user balance for specific generation
ponder.get("/user/:address/gen/:generation", async (c) => {
  try {
    const address = c.req.param("address").toLowerCase();
    const generation = parseInt(c.req.param("generation"));

    // For now, return structure - actual DB query would go here
    return c.json({
      success: true,
      address: address,
      generation: generation,
      data: {
        balanceHomeChain: 0,
        balanceBerachain: 0,
        balanceTotal: 0,
        mintedHomeChain: 0,
        mintedBerachain: 0,
        mintedTotal: 0,
        message: "Use GraphQL endpoint at /graphql for live data",
      },
    });
  } catch (error: any) {
    console.error("Error in /user/:address/gen/:generation:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get holders for a specific collection and chain
ponder.get("/holders/:collection/:chainId", async (c) => {
  try {
    const collection = c.req.param("collection");
    const chainId = parseInt(c.req.param("chainId"));

    return c.json({
      success: true,
      collection: collection,
      chainId: chainId,
      data: {
        holders: [],
        count: 0,
        message: "Use GraphQL endpoint at /graphql for live data",
      },
    });
  } catch (error: any) {
    console.error("Error in /holders/:collection/:chainId:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get stats for a specific collection and chain
ponder.get("/stats/:collection/:chainId", async (c) => {
  try {
    const collection = c.req.param("collection");
    const chainId = parseInt(c.req.param("chainId"));

    return c.json({
      success: true,
      collection: collection,
      chainId: chainId,
      data: {
        totalSupply: 0,
        uniqueHolders: 0,
        lastMintTime: null,
        message: "Use GraphQL endpoint at /graphql for live data",
      },
    });
  } catch (error: any) {
    console.error("Error in /stats/:collection/:chainId:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get recent mints for live activity feed
ponder.get("/transfers/recent", async (c) => {
  try {
    // Parse query parameters
    const url = new URL(c.req.url);
    const onlyMints = url.searchParams.get("mints") === "true";
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const collection = url.searchParams.get("collection"); // Optional filter
    
    // Build GraphQL query
    const whereClause = collection ? `where: {collection: "${collection}"}, ` : "";
    const query = `
      query RecentMints {
        mints(${whereClause}orderBy: "timestamp", orderDirection: "desc", limit: ${limit}) {
          items {
            tokenId
            to
            timestamp
            blockNumber
            transactionHash
            collection
            chainId
          }
        }
      }
    `;
    
    // Execute GraphQL query internally
    const origin = c.req.headers.get("host") || "localhost:42069";
    const protocol = origin.includes("localhost") ? "http" : "https";
    const graphqlUrl = `${protocol}://${origin}/graphql`;
    
    const response = await fetch(graphqlUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });
    
    const result: any = await response.json();
    
    // Transform GraphQL response to match expected format
    if (result?.data?.mints?.items) {
      const transformedData = result.data.mints.items.map((mint: any) => ({
        tokenId: mint.tokenId,
        from: "0x0000000000000000000000000000000000000000", // Mints are always from zero address
        to: mint.to,
        isMint: true,
        timestamp: parseInt(mint.timestamp),
        blockNumber: parseInt(mint.blockNumber),
        txHash: mint.transactionHash,
        collection: mint.collection,
        chainId: mint.chainId,
      }));
      
      return c.json({
        success: true,
        data: transformedData,
      });
    }
    
    return c.json({
      success: true,
      data: [],
    });
  } catch (error: any) {
    console.error("Error in /transfers/recent:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});
