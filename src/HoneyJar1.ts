import { ponder } from "@/generated";

// Constants
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// ============= TRANSFER EVENT HANDLER =============
// Handles both mints (from 0x0) and transfers
ponder.on("HoneyJar1:Transfer", async ({ event, context }) => {
  const { 
    Token,
    Owner,
    TransferEvent
  } = context.db;

  const from = event.args.from.toLowerCase();
  const to = event.args.to.toLowerCase();
  const tokenId = event.args.tokenId.toString();
  const timestamp = Number(event.block.timestamp);
  const blockNumber = Number(event.block.number);
  
  // Determine if this is a mint or transfer
  const isMint = from === ZERO_ADDRESS;
  
  // Create transfer event record with proper null handling
  // Use fallback values if transaction details are null
  const txHash = event.transaction?.hash || `0x${blockNumber.toString(16).padStart(64, '0')}`;
  const logIndex = event.log?.logIndex ?? 0;
  const transferId = `${txHash}-${logIndex}`;
  
  await TransferEvent.create({
    id: transferId,
    tokenId: tokenId,
    from: from,
    to: to,
    isMint: isMint,
    timestamp: timestamp,
    blockNumber: blockNumber,
    transactionHash: txHash,
    logIndex: logIndex,
  });

  // Update or create token record
  const existingToken = await Token.findUnique({ id: tokenId });
  
  if (existingToken) {
    // Update existing token with new owner
    await Token.update({
      id: tokenId,
      currentOwner: to,
      lastTransferTime: timestamp,
      transferCount: existingToken.transferCount + 1,
    });
  } else {
    // Create new token record (this is a mint)
    await Token.create({
      id: tokenId,
      tokenId: BigInt(tokenId),
      currentOwner: to,
      mintedBy: to,
      mintTime: timestamp,
      lastTransferTime: timestamp,
      transferCount: 1,
    });
  }

  // Update owner records
  // Handle "from" owner (unless it's a mint)
  if (!isMint && from !== ZERO_ADDRESS) {
    const fromOwner = await Owner.findUnique({ id: from });
    if (fromOwner && fromOwner.balance > 0) {
      await Owner.update({
        id: from,
        balance: fromOwner.balance - 1,
        lastActivityTime: timestamp,
      });
    }
  }

  // Handle "to" owner
  const toOwner = await Owner.findUnique({ id: to });
  
  if (toOwner) {
    await Owner.update({
      id: to,
      balance: toOwner.balance + 1,
      totalReceived: toOwner.totalReceived + 1,
      lastActivityTime: timestamp,
    });
  } else {
    await Owner.create({
      id: to,
      address: to,
      balance: 1,
      totalReceived: 1,
      totalSent: 0,
      firstActivityTime: timestamp,
      lastActivityTime: timestamp,
    });
  }

  // If it's not a mint, update the "from" owner's sent count
  if (!isMint && from !== ZERO_ADDRESS) {
    const fromOwner = await Owner.findUnique({ id: from });
    if (fromOwner) {
      await Owner.update({
        id: from,
        totalSent: fromOwner.totalSent + 1,
      });
    }
  }
});