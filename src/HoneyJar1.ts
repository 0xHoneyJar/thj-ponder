import { ponder } from "@/generated";
import { NFT_COLLECTIONS } from "../ponder.config";

// Constants
const PRICE_PER_ENTRY = 110000000000000000n; // 0.11 ETH in wei
const COLLECTION_ID = "0x0000000000000000000000000000000000000000"; // TODO: Add actual address

// ============= COLLECTION INITIALIZATION =============
ponder.on("HoneyJar1:setup", async ({ context }) => {
  const { Collection, GlobalStats } = context.db;

  // Initialize collection
  await Collection.upsert({
    id: COLLECTION_ID,
    create: {
      name: NFT_COLLECTIONS.HJ1.name,
      symbol: "HJ1",
      type: "raffle",
      totalSupply: 10000,
      currentSupply: 0,
      pricePerUnit: PRICE_PER_ENTRY,
      isActive: true,
      metadata: {
        description: "Mint Mania Raffle - 38 Premium NFTs",
        website: "https://honeyjars.xyz",
      },
    },
    update: {},
  });

  // Initialize global stats
  await GlobalStats.upsert({
    id: "global",
    create: {
      totalCollections: 1,
      totalMints: 0,
      totalVolume: 0n,
      uniqueBuyers: 0,
      lastUpdateTime: Math.floor(Date.now() / 1000),
    },
    update: {
      totalCollections: 1,
    },
  });
});

// ============= PURCHASE/MINT EVENT HANDLER =============
ponder.on("HoneyJar1:Purchase", async ({ event, context }) => {
  const { 
    MintEntry, 
    Buyer, 
    CollectionBuyer, 
    Collection,
    CollectionStats,
    GlobalStats,
    ActivityFeed 
  } = context.db;

  const buyer = event.args.buyer.toLowerCase();
  const amount = Number(event.args.amount);
  const totalCost = event.args.totalCost;
  const timestamp = Number(event.block.timestamp);
  const blockNumber = Number(event.block.number);

  // 1. Create Mint Entry
  const entryId = `${COLLECTION_ID}-${event.transaction.hash}-${event.log.logIndex}`;
  await MintEntry.create({
    id: entryId,
    collection: COLLECTION_ID,
    buyer: buyer,
    amount: amount,
    totalCost: totalCost,
    pricePerUnit: PRICE_PER_ENTRY,
    timestamp: timestamp,
    blockNumber: blockNumber,
    transactionHash: event.transaction.hash,
    logIndex: event.log.logIndex,
  });

  // 2. Update or Create Buyer Profile
  const existingBuyer = await Buyer.findUnique({ id: buyer });
  
  if (existingBuyer) {
    await Buyer.update({
      id: buyer,
      totalEntries: existingBuyer.totalEntries + amount,
      totalSpent: existingBuyer.totalSpent + totalCost,
      lastMintTime: timestamp,
    });
  } else {
    await Buyer.create({
      id: buyer,
      totalEntries: amount,
      totalSpent: totalCost,
      collectionsParticipated: 1,
      firstMintTime: timestamp,
      lastMintTime: timestamp,
    });
  }

  // 3. Update Collection-specific Buyer Stats
  const collectionBuyerId = `${COLLECTION_ID}-${buyer}`;
  const existingCollectionBuyer = await CollectionBuyer.findUnique({ id: collectionBuyerId });

  if (existingCollectionBuyer) {
    await CollectionBuyer.update({
      id: collectionBuyerId,
      totalEntries: existingCollectionBuyer.totalEntries + amount,
      totalSpent: existingCollectionBuyer.totalSpent + totalCost,
      lastMintTime: timestamp,
    });
  } else {
    await CollectionBuyer.create({
      id: collectionBuyerId,
      collection: COLLECTION_ID,
      buyer: buyer,
      totalEntries: amount,
      totalSpent: totalCost,
      firstMintTime: timestamp,
      lastMintTime: timestamp,
    });
  }

  // 4. Update Collection Supply
  const collection = await Collection.findUnique({ id: COLLECTION_ID });
  if (collection) {
    await Collection.update({
      id: COLLECTION_ID,
      currentSupply: collection.currentSupply + amount,
    });
  }

  // 5. Update Collection Stats
  const stats = await CollectionStats.findUnique({ id: COLLECTION_ID });
  const hourAgo = timestamp - 3600;
  const dayAgo = timestamp - 86400;

  if (stats) {
    // Get recent mints for hourly/daily metrics
    const recentHourMints = await MintEntry.findMany({
      where: {
        collection: COLLECTION_ID,
        timestamp: { gte: hourAgo },
      },
    });

    const recentDayMints = await MintEntry.findMany({
      where: {
        collection: COLLECTION_ID,
        timestamp: { gte: dayAgo },
      },
    });

    const hourlyVolume = recentHourMints.reduce((sum, m) => sum + m.totalCost, 0n);
    const dailyVolume = recentDayMints.reduce((sum, m) => sum + m.totalCost, 0n);

    await CollectionStats.update({
      id: COLLECTION_ID,
      totalMints: stats.totalMints + 1,
      totalVolume: stats.totalVolume + totalCost,
      lastMintTime: timestamp,
      mintsLastHour: recentHourMints.length,
      volumeLastHour: hourlyVolume,
      mintsLast24h: recentDayMints.length,
      volumeLast24h: dailyVolume,
      largestEntry: Math.max(stats.largestEntry, amount),
      averageEntrySize: (stats.averageEntrySize * stats.totalMints + amount) / (stats.totalMints + 1),
    });
  } else {
    await CollectionStats.create({
      id: COLLECTION_ID,
      collection: COLLECTION_ID,
      totalMints: 1,
      uniqueBuyers: 1,
      totalVolume: totalCost,
      averageEntrySize: amount,
      largestEntry: amount,
      lastMintTime: timestamp,
      mintsLastHour: 1,
      volumeLastHour: totalCost,
      mintsLast24h: 1,
      volumeLast24h: totalCost,
    });
  }

  // 6. Update Global Stats
  const globalStats = await GlobalStats.findUnique({ id: "global" });
  if (globalStats) {
    const uniqueBuyers = await Buyer.findMany();
    await GlobalStats.update({
      id: "global",
      totalMints: globalStats.totalMints + 1,
      totalVolume: globalStats.totalVolume + totalCost,
      uniqueBuyers: uniqueBuyers.length,
      lastUpdateTime: timestamp,
    });
  }

  // 7. Add to Activity Feed
  await ActivityFeed.create({
    id: `${timestamp}-${event.transaction.hash}-${event.log.logIndex}`,
    collection: COLLECTION_ID,
    buyer: buyer,
    action: "mint",
    amount: amount,
    value: totalCost,
    timestamp: timestamp,
    transactionHash: event.transaction.hash,
    metadata: {
      blockNumber: blockNumber,
      pricePerUnit: PRICE_PER_ENTRY,
    },
  });

  // 8. Update Leaderboard Rankings (every 10 mints or hourly)
  if (stats && stats.totalMints % 10 === 0) {
    await updateLeaderboardRankings(context, COLLECTION_ID);
  }
});

// ============= HELPER FUNCTIONS =============

async function updateLeaderboardRankings(context: any, collectionId: string) {
  const { CollectionBuyer, LeaderboardSnapshot } = context.db;

  // Get all buyers for this collection sorted by entries
  const buyers = await CollectionBuyer.findMany({
    where: { collection: collectionId },
    orderBy: { totalEntries: "desc" },
    limit: 100,
  });

  // Update ranks
  for (let i = 0; i < buyers.length; i++) {
    await CollectionBuyer.update({
      id: buyers[i].id,
      rank: i + 1,
    });
  }

  // Create leaderboard snapshot
  const timestamp = Math.floor(Date.now() / 1000);
  await LeaderboardSnapshot.create({
    id: `${collectionId}-${timestamp}`,
    collection: collectionId,
    timestamp: timestamp,
    topBuyers: buyers.map((b, i) => ({
      rank: i + 1,
      address: b.buyer,
      entries: b.totalEntries,
      spent: b.totalSpent.toString(),
    })),
    totalParticipants: buyers.length,
    totalVolume: buyers.reduce((sum, b) => sum + b.totalSpent, 0n),
  });
}

// ============= TRANSFER EVENT (Optional) =============
ponder.on("HoneyJar1:Transfer", async ({ event, context }) => {
  // Handle transfers if needed
  // This might be used for secondary sales or transfers
  const from = event.args.from.toLowerCase();
  const to = event.args.to.toLowerCase();
  const tokenId = event.args.tokenId;

  // Add transfer logic here if needed
  console.log(`Transfer: ${from} -> ${to}, Token: ${tokenId}`);
});