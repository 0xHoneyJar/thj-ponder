import { ponder } from "@/generated";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const BERACHAIN_ID = 80094;

// Map collection names to their generation numbers
const COLLECTION_TO_GENERATION: Record<string, number> = {
  "HoneyJar1": 1,
  "HoneyJar2": 2,
  "HoneyJar3": 3,
  "HoneyJar4": 4,
  "HoneyJar5": 5,
  "HoneyJar6": 6,
  "Honeycomb": 0, // 0 for Honeycomb
};

// Map of home chain IDs for each generation
const HOME_CHAIN_IDS: Record<number, number> = {
  1: 1,      // Gen 1 - Ethereum
  2: 42161,  // Gen 2 - Arbitrum
  3: 7777777,// Gen 3 - Zora
  4: 10,     // Gen 4 - Optimism
  5: 8453,   // Gen 5 - Base
  6: 1,      // Gen 6 - Ethereum
  0: 1,      // Honeycomb - Ethereum
};

// Helper function to handle transfer logic
async function handleTransfer(
  event: any,
  context: any,
  collectionName: string,
  chainId: number
) {
  const { Mint, Holder, CollectionStat, UserBalance } = context.db;
  
  const from = event.args.from.toLowerCase();
  const to = event.args.to.toLowerCase();
  const timestamp = BigInt(event.block.timestamp);
  const isMint = from === ZERO_ADDRESS;
  const isBurn = to === ZERO_ADDRESS;
  
  // Get generation number from collection name
  const baseCollection = collectionName.replace("Bera", "").replace("Eth", "");
  const generation = COLLECTION_TO_GENERATION[baseCollection] ?? -1;
  const isBerachain = chainId === BERACHAIN_ID;
  const homeChainId = HOME_CHAIN_IDS[generation];
  const isHomeChain = chainId === homeChainId;
  
  // Track mints for live activity feed
  if (isMint) {
    await Mint.create({
      id: `${collectionName}-${chainId}-${event.transaction.hash}-${event.log.logIndex}`,
      data: {
        tokenId: event.args.tokenId,
        to: to,
        timestamp: timestamp,
        blockNumber: BigInt(event.block.number),
        transactionHash: event.transaction.hash,
        collection: collectionName,
        chainId: chainId,
      }
    });
  }
  
  // Update Holder balances (per collection per chain)
  
  // Handle "from" holder (unless it's a mint)
  if (!isMint) {
    const fromHolderId = `${from}-${collectionName}-${chainId}`;
    const fromHolder = await Holder.findUnique({ id: fromHolderId });
    if (fromHolder && fromHolder.balance > 0) {
      const newBalance = fromHolder.balance - 1;
      
      // Delete if balance reaches zero, otherwise update
      if (newBalance === 0) {
        await Holder.delete({
          id: fromHolderId
        });
      } else {
        await Holder.update({
          id: fromHolderId,
          data: {
            balance: newBalance,
            lastActivityTime: timestamp,
          }
        });
      }
    }
  }
  
  // Handle "to" holder (unless it's a burn)
  if (!isBurn) {
    const toHolderId = `${to}-${collectionName}-${chainId}`;
    const toHolder = await Holder.findUnique({ id: toHolderId });
    
    if (toHolder) {
      await Holder.update({
        id: toHolderId,
        data: {
          balance: toHolder.balance + 1,
          totalMinted: isMint ? toHolder.totalMinted + 1 : toHolder.totalMinted,
          lastActivityTime: timestamp,
        }
      });
    } else {
      await Holder.create({
        id: toHolderId,
        data: {
          address: to,
          balance: 1,
          totalMinted: isMint ? 1 : 0,
          lastActivityTime: timestamp,
          firstMintTime: isMint ? timestamp : undefined,
          collection: collectionName,
          chainId: chainId,
        }
      });
    }
  }
  
  // Update UserBalance (cross-chain totals)
  if (generation >= 0) {
    // Update "from" user balance (unless it's a mint)
    if (!isMint) {
      const fromUserBalanceId = `${from}-gen${generation}`;
      const fromUserBalance = await UserBalance.findUnique({ id: fromUserBalanceId });
      
      if (fromUserBalance) {
        const newHomeBalance = isHomeChain 
          ? Math.max(0, fromUserBalance.balanceHomeChain - 1)
          : fromUserBalance.balanceHomeChain;
        const newBeraBalance = isBerachain
          ? Math.max(0, fromUserBalance.balanceBerachain - 1)
          : fromUserBalance.balanceBerachain;
        const newTotal = newHomeBalance + newBeraBalance;
        
        // Delete the record if balance reaches zero, otherwise update
        if (newTotal === 0) {
          await UserBalance.delete({
            id: fromUserBalanceId
          });
        } else {
          await UserBalance.update({
            id: fromUserBalanceId,
            data: {
              balanceHomeChain: newHomeBalance,
              balanceBerachain: newBeraBalance,
              balanceTotal: newTotal,
              lastActivityTime: timestamp,
            }
          });
        }
      }
    }
    
    // Update "to" user balance (unless it's a burn)
    if (!isBurn) {
      const toUserBalanceId = `${to}-gen${generation}`;
      const toUserBalance = await UserBalance.findUnique({ id: toUserBalanceId });
      
      if (toUserBalance) {
        const newHomeBalance = isHomeChain 
          ? toUserBalance.balanceHomeChain + 1
          : toUserBalance.balanceHomeChain;
        const newBeraBalance = isBerachain
          ? toUserBalance.balanceBerachain + 1
          : toUserBalance.balanceBerachain;
        const newMintedHome = (isMint && isHomeChain)
          ? toUserBalance.mintedHomeChain + 1
          : toUserBalance.mintedHomeChain;
        const newMintedBera = (isMint && isBerachain)
          ? toUserBalance.mintedBerachain + 1
          : toUserBalance.mintedBerachain;
        
        await UserBalance.update({
          id: toUserBalanceId,
          data: {
            balanceHomeChain: newHomeBalance,
            balanceBerachain: newBeraBalance,
            balanceTotal: newHomeBalance + newBeraBalance,
            mintedHomeChain: newMintedHome,
            mintedBerachain: newMintedBera,
            mintedTotal: newMintedHome + newMintedBera,
            lastActivityTime: timestamp,
          }
        });
      } else {
        await UserBalance.create({
          id: toUserBalanceId,
          data: {
            address: to,
            generation: generation,
            balanceHomeChain: isHomeChain ? 1 : 0,
            balanceBerachain: isBerachain ? 1 : 0,
            balanceTotal: 1,
            mintedHomeChain: (isMint && isHomeChain) ? 1 : 0,
            mintedBerachain: (isMint && isBerachain) ? 1 : 0,
            mintedTotal: isMint ? 1 : 0,
            lastActivityTime: timestamp,
            firstMintTime: isMint ? timestamp : undefined,
          }
        });
      }
    }
  }
  
  // Update collection stats
  const statsId = `${collectionName}-${chainId}`;
  const existingStats = await CollectionStat.findUnique({ id: statsId });
  
  const currentTokenId = Number(event.args.tokenId);
  
  if (existingStats) {
    const shouldUpdateSupply = currentTokenId > (existingStats.totalSupply || 0);
    const toHolderExists = await Holder.findUnique({ id: `${to}-${collectionName}-${chainId}` });
    
    await CollectionStat.update({
      id: statsId,
      data: {
        totalSupply: shouldUpdateSupply ? currentTokenId : existingStats.totalSupply,
        lastMintTime: isMint ? timestamp : existingStats.lastMintTime,
        uniqueHolders: (!toHolderExists && !isBurn) 
          ? existingStats.uniqueHolders + 1 
          : existingStats.uniqueHolders,
      }
    });
  } else {
    await CollectionStat.create({
      id: statsId,
      data: {
        collection: collectionName,
        totalSupply: currentTokenId,
        uniqueHolders: !isBurn ? 1 : 0,
        lastMintTime: isMint ? timestamp : undefined,
        chainId: chainId,
      }
    });
  }
}

// Register handlers for all HoneyJar contracts on home chains
ponder.on("HoneyJar1:Transfer", async ({ event, context }) => {
  await handleTransfer(event, context, "HoneyJar1", 1);
});

ponder.on("HoneyJar2:Transfer", async ({ event, context }) => {
  await handleTransfer(event, context, "HoneyJar2", 42161);
});

ponder.on("HoneyJar3:Transfer", async ({ event, context }) => {
  await handleTransfer(event, context, "HoneyJar3", 7777777);
});

ponder.on("HoneyJar4:Transfer", async ({ event, context }) => {
  await handleTransfer(event, context, "HoneyJar4", 10);
});

ponder.on("HoneyJar5:Transfer", async ({ event, context }) => {
  await handleTransfer(event, context, "HoneyJar5", 8453);
});

ponder.on("HoneyJar6:Transfer", async ({ event, context }) => {
  await handleTransfer(event, context, "HoneyJar6", 1);
});

// Register handlers for all HoneyJar contracts on Berachain
ponder.on("HoneyJar1Bera:Transfer", async ({ event, context }) => {
  await handleTransfer(event, context, "HoneyJar1", BERACHAIN_ID);
});

ponder.on("HoneyJar2Bera:Transfer", async ({ event, context }) => {
  await handleTransfer(event, context, "HoneyJar2", BERACHAIN_ID);
});

ponder.on("HoneyJar3Bera:Transfer", async ({ event, context }) => {
  await handleTransfer(event, context, "HoneyJar3", BERACHAIN_ID);
});

ponder.on("HoneyJar4Bera:Transfer", async ({ event, context }) => {
  await handleTransfer(event, context, "HoneyJar4", BERACHAIN_ID);
});

ponder.on("HoneyJar5Bera:Transfer", async ({ event, context }) => {
  await handleTransfer(event, context, "HoneyJar5", BERACHAIN_ID);
});

ponder.on("HoneyJar6Bera:Transfer", async ({ event, context }) => {
  await handleTransfer(event, context, "HoneyJar6", BERACHAIN_ID);
});

// Register handlers for Honeycomb contracts
ponder.on("HoneycombEth:Transfer", async ({ event, context }) => {
  await handleTransfer(event, context, "Honeycomb", 1);
});

ponder.on("HoneycombBera:Transfer", async ({ event, context }) => {
  await handleTransfer(event, context, "Honeycomb", BERACHAIN_ID);
});

// ============================================
// VAULT EVENT HANDLERS
// ============================================

// Handle vault account opening
ponder.on("MoneycombVault:AccountOpened", async ({ event, context }) => {
  const { Vault, VaultActivity, UserVaultSummary } = context.db;
  
  const user = event.args.user.toLowerCase();
  const accountIndex = Number(event.args.accountIndex);
  const honeycombId = event.args.honeycombId;
  const timestamp = BigInt(event.block.timestamp);
  
  const vaultId = `${user}-${accountIndex}`;
  const activityId = `${event.transaction.hash}-${event.log.logIndex}`;
  
  // Create vault record
  await Vault.create({
    id: vaultId,
    data: {
      user: user,
      accountIndex: accountIndex,
      honeycombId: honeycombId,
      isActive: true,
      shares: 0n,
      totalBurned: 0,
      burnedGen1: false,
      burnedGen2: false,
      burnedGen3: false,
      burnedGen4: false,
      burnedGen5: false,
      burnedGen6: false,
      createdAt: timestamp,
      lastActivityTime: timestamp,
    }
  });
  
  // Record activity
  await VaultActivity.create({
    id: activityId,
    data: {
      user: user,
      accountIndex: accountIndex,
      type: "opened",
      timestamp: timestamp,
      blockNumber: BigInt(event.block.number),
      transactionHash: event.transaction.hash,
      honeycombId: honeycombId,
    }
  });
  
  // Update user summary
  const userSummary = await UserVaultSummary.findUnique({ id: user });
  if (userSummary) {
    await UserVaultSummary.update({
      id: user,
      data: {
        totalVaults: userSummary.totalVaults + 1,
        activeVaults: userSummary.activeVaults + 1,
        lastActivityTime: timestamp,
      }
    });
  } else {
    await UserVaultSummary.create({
      id: user,
      data: {
        user: user,
        totalVaults: 1,
        activeVaults: 1,
        totalShares: 0n,
        totalRewardsClaimed: 0n,
        totalHJsBurned: 0,
        firstVaultTime: timestamp,
        lastActivityTime: timestamp,
      }
    });
  }
});

// Handle HoneyJar burning
ponder.on("MoneycombVault:HJBurned", async ({ event, context }) => {
  const { Vault, VaultActivity, UserVaultSummary } = context.db;
  
  const user = event.args.user.toLowerCase();
  const accountIndex = Number(event.args.accountIndex);
  const hjGen = Number(event.args.hjGen);
  const timestamp = BigInt(event.block.timestamp);
  
  const vaultId = `${user}-${accountIndex}`;
  const activityId = `${event.transaction.hash}-${event.log.logIndex}`;
  
  // Update vault record
  const vault = await Vault.findUnique({ id: vaultId });
  if (vault) {
    const burnedGenField = `burnedGen${hjGen}` as keyof typeof vault;
    await Vault.update({
      id: vaultId,
      data: {
        totalBurned: vault.totalBurned + 1,
        [`burnedGen${hjGen}`]: true,
        lastActivityTime: timestamp,
      }
    });
  }
  
  // Record activity
  await VaultActivity.create({
    id: activityId,
    data: {
      user: user,
      accountIndex: accountIndex,
      type: "burned",
      timestamp: timestamp,
      blockNumber: BigInt(event.block.number),
      transactionHash: event.transaction.hash,
      hjGen: hjGen,
    }
  });
  
  // Update user summary
  const userSummary = await UserVaultSummary.findUnique({ id: user });
  if (userSummary) {
    await UserVaultSummary.update({
      id: user,
      data: {
        totalHJsBurned: userSummary.totalHJsBurned + 1,
        lastActivityTime: timestamp,
      }
    });
  }
});

// Handle shares minting
ponder.on("MoneycombVault:SharesMinted", async ({ event, context }) => {
  const { Vault, VaultActivity, UserVaultSummary } = context.db;
  
  const user = event.args.user.toLowerCase();
  const accountIndex = Number(event.args.accountIndex);
  const shares = event.args.shares;
  const timestamp = BigInt(event.block.timestamp);
  
  const vaultId = `${user}-${accountIndex}`;
  const activityId = `${event.transaction.hash}-${event.log.logIndex}`;
  
  // Update vault shares
  const vault = await Vault.findUnique({ id: vaultId });
  if (vault) {
    await Vault.update({
      id: vaultId,
      data: {
        shares: vault.shares + shares,
        lastActivityTime: timestamp,
      }
    });
  }
  
  // Record activity
  await VaultActivity.create({
    id: activityId,
    data: {
      user: user,
      accountIndex: accountIndex,
      type: "shares_minted",
      timestamp: timestamp,
      blockNumber: BigInt(event.block.number),
      transactionHash: event.transaction.hash,
      shares: shares,
    }
  });
  
  // Update user summary
  const userSummary = await UserVaultSummary.findUnique({ id: user });
  if (userSummary) {
    await UserVaultSummary.update({
      id: user,
      data: {
        totalShares: userSummary.totalShares + shares,
        lastActivityTime: timestamp,
      }
    });
  }
});

// Handle reward claims
ponder.on("MoneycombVault:RewardClaimed", async ({ event, context }) => {
  const { VaultActivity, UserVaultSummary } = context.db;
  
  const user = event.args.user.toLowerCase();
  const reward = event.args.reward;
  const timestamp = BigInt(event.block.timestamp);
  
  const activityId = `${event.transaction.hash}-${event.log.logIndex}`;
  
  // Record activity
  await VaultActivity.create({
    id: activityId,
    data: {
      user: user,
      accountIndex: 0, // Rewards are not vault-specific
      type: "claimed",
      timestamp: timestamp,
      blockNumber: BigInt(event.block.number),
      transactionHash: event.transaction.hash,
      reward: reward,
    }
  });
  
  // Update user summary
  const userSummary = await UserVaultSummary.findUnique({ id: user });
  if (userSummary) {
    await UserVaultSummary.update({
      id: user,
      data: {
        totalRewardsClaimed: userSummary.totalRewardsClaimed + reward,
        lastActivityTime: timestamp,
      }
    });
  }
});

// Handle vault closing
ponder.on("MoneycombVault:AccountClosed", async ({ event, context }) => {
  const { Vault, VaultActivity, UserVaultSummary } = context.db;
  
  const user = event.args.user.toLowerCase();
  const accountIndex = Number(event.args.accountIndex);
  const honeycombId = event.args.honeycombId;
  const timestamp = BigInt(event.block.timestamp);
  
  const vaultId = `${user}-${accountIndex}`;
  const activityId = `${event.transaction.hash}-${event.log.logIndex}`;
  
  // Update vault record
  const vault = await Vault.findUnique({ id: vaultId });
  if (vault) {
    await Vault.update({
      id: vaultId,
      data: {
        isActive: false,
        closedAt: timestamp,
        lastActivityTime: timestamp,
      }
    });
  }
  
  // Record activity
  await VaultActivity.create({
    id: activityId,
    data: {
      user: user,
      accountIndex: accountIndex,
      type: "closed",
      timestamp: timestamp,
      blockNumber: BigInt(event.block.number),
      transactionHash: event.transaction.hash,
      honeycombId: honeycombId,
    }
  });
  
  // Update user summary
  const userSummary = await UserVaultSummary.findUnique({ id: user });
  if (userSummary && userSummary.activeVaults > 0) {
    await UserVaultSummary.update({
      id: user,
      data: {
        activeVaults: userSummary.activeVaults - 1,
        lastActivityTime: timestamp,
      }
    });
  }
});