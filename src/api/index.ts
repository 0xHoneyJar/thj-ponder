import { ponder } from "@/generated";
import { graphql } from "@ponder/core";

// ============= REST API ENDPOINTS =============

// GET /api/entries/recent - Get recent entries for live feed
ponder.get("/api/entries/recent", async (c) => {
  const { ActivityFeed, Buyer } = c.db;
  
  const collection = c.req.query("collection") || "0x0000000000000000000000000000000000000000";
  const limit = parseInt(c.req.query("limit") || "20");
  
  const recentActivity = await ActivityFeed.findMany({
    where: { 
      collection: collection,
      action: "mint" 
    },
    orderBy: { timestamp: "desc" },
    limit: limit,
  });

  // Enhance with buyer details
  const enrichedActivity = await Promise.all(
    recentActivity.map(async (activity) => {
      const buyer = await Buyer.findUnique({ id: activity.buyer });
      return {
        ...activity,
        buyerProfile: {
          totalEntries: buyer?.totalEntries || 0,
          rank: buyer?.rank || null,
        },
      };
    })
  );

  return c.json({ 
    success: true,
    data: enrichedActivity 
  });
});

// GET /api/leaderboard - Get top buyers
ponder.get("/api/leaderboard", async (c) => {
  const { CollectionBuyer, Buyer } = c.db;
  
  const collection = c.req.query("collection") || "0x0000000000000000000000000000000000000000";
  const limit = parseInt(c.req.query("limit") || "10");
  
  const topBuyers = await CollectionBuyer.findMany({
    where: { collection: collection },
    orderBy: { totalEntries: "desc" },
    limit: limit,
  });

  // Enhance with global buyer data
  const enrichedBuyers = await Promise.all(
    topBuyers.map(async (cb) => {
      const buyer = await Buyer.findUnique({ id: cb.buyer });
      return {
        rank: cb.rank || 0,
        address: cb.buyer,
        totalEntries: cb.totalEntries,
        totalSpent: cb.totalSpent.toString(),
        firstMint: cb.firstMintTime,
        lastMint: cb.lastMintTime,
        globalStats: {
          collectionsParticipated: buyer?.collectionsParticipated || 1,
          globalRank: buyer?.rank || null,
        },
      };
    })
  );

  return c.json({ 
    success: true,
    data: enrichedBuyers 
  });
});

// GET /api/stats - Get collection statistics
ponder.get("/api/stats", async (c) => {
  const { Collection, CollectionStats, GlobalStats } = c.db;
  
  const collectionId = c.req.query("collection") || "0x0000000000000000000000000000000000000000";
  
  const collection = await Collection.findUnique({ id: collectionId });
  const stats = await CollectionStats.findUnique({ id: collectionId });
  const globalStats = await GlobalStats.findUnique({ id: "global" });

  if (!collection || !stats) {
    return c.json({ 
      success: false, 
      error: "Collection not found" 
    }, 404);
  }

  return c.json({
    success: true,
    data: {
      collection: {
        name: collection.name,
        totalSupply: collection.totalSupply,
        currentSupply: collection.currentSupply,
        percentComplete: (collection.currentSupply / collection.totalSupply) * 100,
        pricePerUnit: collection.pricePerUnit.toString(),
        isActive: collection.isActive,
      },
      stats: {
        totalMints: stats.totalMints,
        uniqueBuyers: stats.uniqueBuyers,
        totalVolume: stats.totalVolume.toString(),
        averageEntrySize: stats.averageEntrySize,
        largestEntry: stats.largestEntry,
        lastMintTime: stats.lastMintTime,
        activity: {
          mintsLastHour: stats.mintsLastHour,
          volumeLastHour: stats.volumeLastHour.toString(),
          mintsLast24h: stats.mintsLast24h,
          volumeLast24h: stats.volumeLast24h.toString(),
        },
      },
      global: globalStats ? {
        totalCollections: globalStats.totalCollections,
        totalMints: globalStats.totalMints,
        totalVolume: globalStats.totalVolume.toString(),
        uniqueBuyers: globalStats.uniqueBuyers,
      } : null,
    },
  });
});

// GET /api/buyer/:address - Get specific buyer info
ponder.get("/api/buyer/:address", async (c) => {
  const { Buyer, CollectionBuyer, MintEntry } = c.db;
  
  const address = c.req.param("address").toLowerCase();
  const collection = c.req.query("collection");
  
  const buyer = await Buyer.findUnique({ id: address });
  
  if (!buyer) {
    return c.json({ 
      success: false, 
      error: "Buyer not found" 
    }, 404);
  }

  // Get collection-specific stats if requested
  let collectionStats = null;
  if (collection) {
    const cb = await CollectionBuyer.findUnique({ 
      id: `${collection}-${address}` 
    });
    
    if (cb) {
      // Get recent entries
      const recentEntries = await MintEntry.findMany({
        where: { 
          buyer: address,
          collection: collection 
        },
        orderBy: { timestamp: "desc" },
        limit: 5,
      });
      
      collectionStats = {
        totalEntries: cb.totalEntries,
        totalSpent: cb.totalSpent.toString(),
        rank: cb.rank,
        firstMint: cb.firstMintTime,
        lastMint: cb.lastMintTime,
        recentEntries: recentEntries.map(e => ({
          amount: e.amount,
          cost: e.totalCost.toString(),
          timestamp: e.timestamp,
          txHash: e.transactionHash,
        })),
      };
    }
  }

  // Get all collections this buyer participated in
  const allParticipations = await CollectionBuyer.findMany({
    where: { buyer: address },
  });

  return c.json({
    success: true,
    data: {
      global: {
        address: buyer.id,
        totalEntries: buyer.totalEntries,
        totalSpent: buyer.totalSpent.toString(),
        collectionsParticipated: buyer.collectionsParticipated,
        firstMintTime: buyer.firstMintTime,
        lastMintTime: buyer.lastMintTime,
        globalRank: buyer.rank,
      },
      collectionStats: collectionStats,
      allCollections: allParticipations.map(p => ({
        collection: p.collection,
        entries: p.totalEntries,
        spent: p.totalSpent.toString(),
        rank: p.rank,
      })),
    },
  });
});

// GET /api/collections - List all indexed collections
ponder.get("/api/collections", async (c) => {
  const { Collection, CollectionStats } = c.db;
  
  const collections = await Collection.findMany({
    orderBy: { currentSupply: "desc" },
  });

  const enrichedCollections = await Promise.all(
    collections.map(async (col) => {
      const stats = await CollectionStats.findUnique({ id: col.id });
      return {
        address: col.id,
        name: col.name,
        type: col.type,
        progress: {
          current: col.currentSupply,
          total: col.totalSupply,
          percent: (col.currentSupply / col.totalSupply) * 100,
        },
        stats: stats ? {
          totalVolume: stats.totalVolume.toString(),
          uniqueBuyers: stats.uniqueBuyers,
          lastActivity: stats.lastMintTime,
        } : null,
        isActive: col.isActive,
      };
    })
  );

  return c.json({
    success: true,
    data: enrichedCollections,
  });
});

// ============= GRAPHQL API (Optional) =============

// You can also expose a GraphQL API for more complex queries
ponder.use("/graphql", graphql());

// ============= WEBSOCKET SUPPORT (Future) =============

// Note: WebSocket support requires custom implementation
// This is a placeholder for real-time updates
// ponder.ws("/ws", async (c) => {
//   // Implement WebSocket logic for real-time updates
// });