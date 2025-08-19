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

// Get recent transfers
ponder.get("/transfers/recent", async (c) => {
  try {
    return c.json({
      success: true,
      data: {
        transfers: [],
        count: 0,
        message: "Use GraphQL endpoint at /graphql for live data",
      },
    });
  } catch (error: any) {
    console.error("Error in /transfers/recent:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});
