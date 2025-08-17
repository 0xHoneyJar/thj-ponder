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

// For now, return empty data until we can figure out proper database access
// The GraphQL endpoint at /graphql works directly

ponder.get("/transfers/recent", async (c) => {
  try {
    // Return empty for now - use GraphQL endpoint directly
    return c.json({
      success: true,
      data: [],
      message: "Please use /graphql endpoint for queries"
    });
  } catch (error: any) {
    console.error("Error in /transfers/recent:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

ponder.get("/holders", async (c) => {
  try {
    // Return empty for now - use GraphQL endpoint directly
    return c.json({
      success: true,
      data: [],
      message: "Please use /graphql endpoint for queries"
    });
  } catch (error: any) {
    console.error("Error in /holders:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

ponder.get("/stats", async (c) => {
  try {
    // Return empty for now - use GraphQL endpoint directly
    return c.json({
      success: true,
      data: {
        totalSupply: 0,
        uniqueHolders: 0,
        totalTransfers: 0,
        totalMints: 0,
        topHolders: []
      },
      message: "Please use /graphql endpoint for queries"
    });
  } catch (error: any) {
    console.error("Error in /stats:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});