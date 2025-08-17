import { ponder } from "@/generated";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

ponder.on("HoneyJar1:Transfer", async ({ event, context }) => {
  const { Transfer, Holder } = context.db;
  
  const from = event.args.from.toLowerCase();
  const to = event.args.to.toLowerCase();
  const timestamp = BigInt(event.block.timestamp);
  const isMint = from === ZERO_ADDRESS;
  
  // Create transfer record
  await Transfer.create({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    data: {
      tokenId: event.args.tokenId,
      from: from,
      to: to,
      timestamp: timestamp,
      blockNumber: BigInt(event.block.number),
      transactionHash: event.transaction.hash,
    }
  });
  
  // Update holder balances
  
  // Handle "from" holder (unless it's a mint)
  if (!isMint) {
    const fromHolder = await Holder.findUnique({ id: from });
    if (fromHolder && fromHolder.balance > 0) {
      await Holder.update({
        id: from,
        data: {
          balance: fromHolder.balance - 1,
          lastActivityTime: timestamp,
        }
      });
    }
  }
  
  // Handle "to" holder
  const toHolder = await Holder.findUnique({ id: to });
  
  if (toHolder) {
    // Update existing holder
    await Holder.update({
      id: to,
      data: {
        balance: toHolder.balance + 1,
        totalMinted: isMint ? toHolder.totalMinted + 1 : toHolder.totalMinted,
        lastActivityTime: timestamp,
      }
    });
  } else {
    // Create new holder
    await Holder.create({
      id: to,
      data: {
        address: to,
        balance: 1,
        totalMinted: isMint ? 1 : 0,
        lastActivityTime: timestamp,
        firstMintTime: isMint ? timestamp : undefined,
      }
    });
  }
});