import { ponder } from "@/generated";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

ponder.on("HoneyJar4:Transfer", async ({ event, context }) => {
  const { Transfer, Holder, CollectionStats } = context.db;
  
  const from = event.args.from.toLowerCase();
  const to = event.args.to.toLowerCase();
  const timestamp = BigInt(event.block.timestamp);
  const isMint = from === ZERO_ADDRESS;
  const collection = "HoneyJar4";
  const chainId = 10;
  
  // Create transfer record with collection info
  await Transfer.create({
    id: `${collection}-${event.transaction.hash}-${event.log.logIndex}`,
    data: {
      tokenId: event.args.tokenId,
      from: from,
      to: to,
      timestamp: timestamp,
      blockNumber: BigInt(event.block.number),
      transactionHash: event.transaction.hash,
      collection: collection,
      chainId: chainId,
    }
  });
  
  // Update holder balances with collection-specific IDs
  
  // Handle "from" holder (unless it's a mint)
  if (!isMint) {
    const fromHolderId = `${from}-${collection}`;
    const fromHolder = await Holder.findUnique({ id: fromHolderId });
    if (fromHolder && fromHolder.balance > 0) {
      await Holder.update({
        id: fromHolderId,
        data: {
          balance: fromHolder.balance - 1,
          lastActivityTime: timestamp,
        }
      });
    }
  }
  
  // Handle "to" holder
  const toHolderId = `${to}-${collection}`;
  const toHolder = await Holder.findUnique({ id: toHolderId });
  
  if (toHolder) {
    // Update existing holder
    await Holder.update({
      id: toHolderId,
      data: {
        balance: toHolder.balance + 1,
        totalMinted: isMint ? toHolder.totalMinted + 1 : toHolder.totalMinted,
        lastActivityTime: timestamp,
      }
    });
  } else {
    // Create new holder
    await Holder.create({
      id: toHolderId,
      data: {
        address: to,
        balance: 1,
        totalMinted: isMint ? 1 : 0,
        lastActivityTime: timestamp,
        firstMintTime: isMint ? timestamp : undefined,
        collection: collection,
        chainId: chainId,
      }
    });
  }
});  
  // Update collection stats
  const statsId = "HoneyJar4";
  const existingStats = await CollectionStats.findUnique({ id: statsId });
  
  if (isMint) {
    // If it's a mint, increment total supply
    if (existingStats) {
      await CollectionStats.update({
        id: statsId,
        data: {
          totalSupply: existingStats.totalSupply + 1,
          lastMintTime: timestamp,
          // Update unique holders count if this is a new holder
          uniqueHolders: toHolder ? existingStats.uniqueHolders : existingStats.uniqueHolders + 1,
        }
      });
    } else {
      // First mint for this collection
      await CollectionStats.create({
        id: statsId,
        data: {
          collection: collection,
          totalSupply: 1,
          uniqueHolders: 1,
          lastMintTime: timestamp,
          chainId: chainId,
        }
      });
    }
  }
});
