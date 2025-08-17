import { ponder } from "@/generated";

ponder.on("HoneyJar1:Transfer", async ({ event, context }) => {
  const { Transfer } = context.db;
  
  await Transfer.create({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    data: {
      tokenId: event.args.tokenId,
      from: event.args.from,
      to: event.args.to,
      timestamp: BigInt(event.block.timestamp),
      blockNumber: BigInt(event.block.number),
    }
  });
});