import { ponder } from "@/generated";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

ponder.on("HoneyJar1:Transfer", async ({ event, context }) => {
  const { Transfer, Holder, CollectionStat } = context.db;
  
  // Validate this is mainnet data (latest mainnet block ~21M, not 41M+)
  if (event.block.number > 30000000n) {
    console.error(`Rejecting invalid block ${event.block.number} for mainnet - likely wrong chain data`);
    return;
  }
  
  const from = event.args.from.toLowerCase();
  const to = event.args.to.toLowerCase();
  const timestamp = BigInt(event.block.timestamp);
  const isMint = from === ZERO_ADDRESS;
  const collection = "HoneyJar1";
  const chainId = 1;
  
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
  
  // Update collection stats
  const statsId = "HoneyJar1";
  const existingStats = await CollectionStat.findUnique({ id: statsId });
  
  // Track the highest tokenId we've seen as the total supply
  // This works for sequential minting contracts like HoneyJar
  const currentTokenId = Number(event.args.tokenId);
  
  if (existingStats) {
    // Always update if we see a higher tokenId or if it's a mint
    const shouldUpdateSupply = currentTokenId > (existingStats.totalSupply || 0);
    
    await CollectionStat.update({
      id: statsId,
      data: {
        // Use the highest tokenId as totalSupply (assuming sequential minting)
        totalSupply: shouldUpdateSupply ? currentTokenId : existingStats.totalSupply,
        lastMintTime: isMint ? timestamp : existingStats.lastMintTime,
        // Update unique holders count if this is a new holder receiving tokens
        uniqueHolders: !toHolder && to !== ZERO_ADDRESS ? existingStats.uniqueHolders + 1 : existingStats.uniqueHolders,
      }
    });
  } else {
    // First transfer for this collection
    await CollectionStat.create({
      id: statsId,
      data: {
        collection: collection,
        totalSupply: currentTokenId, // Start with the first tokenId we see
        uniqueHolders: to !== ZERO_ADDRESS ? 1 : 0,
        lastMintTime: isMint ? timestamp : undefined,
        chainId: chainId,
      }
    });
  }
});