import { ponder } from "@/generated";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// Chain ID mapping
const CHAIN_IDS = {
  mainnet: 1,
  arbitrum: 42161,
  zora: 7777777,
  optimism: 10,
  base: 8453,
} as const;

// Create a handler for each HoneyJar collection
const collections = [
  { name: "HoneyJar1", chainId: CHAIN_IDS.mainnet },
  { name: "HoneyJar2", chainId: CHAIN_IDS.arbitrum },
  { name: "HoneyJar3", chainId: CHAIN_IDS.zora },
  { name: "HoneyJar4", chainId: CHAIN_IDS.optimism },
  { name: "HoneyJar5", chainId: CHAIN_IDS.base },
  { name: "HoneyJar6", chainId: CHAIN_IDS.mainnet },
];

// Register handlers for each collection
collections.forEach(({ name, chainId }) => {
  ponder.on(`${name}:Transfer` as any, async ({ event, context }: any) => {
    const { Transfer, Holder } = context.db;
    
    const from = event.args.from.toLowerCase();
    const to = event.args.to.toLowerCase();
    const timestamp = BigInt(event.block.timestamp);
    const isMint = from === ZERO_ADDRESS;
    
    // Create transfer record with collection info
    await Transfer.create({
      id: `${name}-${event.transaction.hash}-${event.log.logIndex}`,
      data: {
        tokenId: event.args.tokenId,
        from: from,
        to: to,
        timestamp: timestamp,
        blockNumber: BigInt(event.block.number),
        transactionHash: event.transaction.hash,
        collection: name,
        chainId: chainId,
      }
    });
    
    // Update holder balances with collection-specific IDs
    
    // Handle "from" holder (unless it's a mint)
    if (!isMint) {
      const fromHolderId = `${from}-${name}`;
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
    const toHolderId = `${to}-${name}`;
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
          collection: name,
          chainId: chainId,
        }
      });
    }
  });
});