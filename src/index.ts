import { ponder } from "@/generated";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const BERACHAIN_ID = 80094;

// Kingdomly proxy bridge contracts (these hold NFTs when bridged to Berachain)
// We should exclude these from holder counts to avoid double-counting
const PROXY_CONTRACTS: Record<string, string> = {
  // Home chain -> Berachain proxy contracts (lowercase)
  "HoneyJar1": "0xe0b791529f7876dc2b9d748a2e6570e605f40e5e".toLowerCase(),
  "HoneyJar2": "0xd1d5df5f85c0fcbdc5c9757272de2ee5296ed512".toLowerCase(),
  "HoneyJar3": "0x3992605f13bc182c0b0c60029fcbb21c0626a5f1".toLowerCase(),
  "HoneyJar4": "0xeeaa4926019eaed089b8b66b544deb320c04e421".toLowerCase(),
  "HoneyJar5": "0x00331b0e835c511489dba62a2b16b8fa380224f9".toLowerCase(),
  "HoneyJar6": "0x0de0f0a9f7f1a56dafd025d0f31c31c6cb190346".toLowerCase(),
  "Honeycomb": "0x33a76173680427cba3ffc3a625b7bc43b08ce0c5".toLowerCase(),
};

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
  const { Mint, Holder, CollectionStat, UserBalance, Token } = context.db;
  
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
  const isEthereum = chainId === 1;
  const isThirdChain = !isHomeChain && !isBerachain; // For NFTs bridged to Ethereum when not native
  
  // Check if this is a transfer to/from a proxy bridge contract
  const proxyAddress = PROXY_CONTRACTS[baseCollection];
  const isToProxy = proxyAddress && to === proxyAddress;
  const isFromProxy = proxyAddress && from === proxyAddress;
  
  // Treat transfers TO proxy as "bridging out" (like burns for counting purposes)
  // Treat transfers FROM proxy as "bridging in" (like mints for counting purposes)
  // This prevents double-counting when NFTs are locked in the bridge
  
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
  
  // Handle "from" holder (unless it's a mint or from proxy)
  if (!isMint && !isFromProxy) {
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
  
  // Handle "to" holder (unless it's a burn or to proxy)
  if (!isBurn && !isToProxy) {
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
    // Update "from" user balance (unless it's a mint or from proxy)
    // We skip proxy "from" because it's just returning from bridge
    if (!isMint && !isFromProxy) {
      const fromUserBalanceId = `${from}-gen${generation}`;
      const fromUserBalance = await UserBalance.findUnique({ id: fromUserBalanceId });
      
      if (fromUserBalance) {
        const newHomeBalance = isHomeChain 
          ? Math.max(0, fromUserBalance.balanceHomeChain - 1)
          : fromUserBalance.balanceHomeChain;
        const newEthereumBalance = (isEthereum && !isHomeChain)
          ? Math.max(0, fromUserBalance.balanceEthereum - 1)
          : fromUserBalance.balanceEthereum;
        const newBeraBalance = isBerachain
          ? Math.max(0, fromUserBalance.balanceBerachain - 1)
          : fromUserBalance.balanceBerachain;
        const newTotal = newHomeBalance + newEthereumBalance + newBeraBalance;
        
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
              balanceEthereum: newEthereumBalance,
              balanceBerachain: newBeraBalance,
              balanceTotal: newTotal,
              lastActivityTime: timestamp,
            }
          });
        }
      }
    }
    
    // Update "to" user balance (unless it's a burn or to proxy)
    // We skip proxy "to" because the NFT is being locked in bridge
    if (!isBurn && !isToProxy) {
      const toUserBalanceId = `${to}-gen${generation}`;
      const toUserBalance = await UserBalance.findUnique({ id: toUserBalanceId });
      
      if (toUserBalance) {
        const newHomeBalance = isHomeChain 
          ? toUserBalance.balanceHomeChain + 1
          : toUserBalance.balanceHomeChain;
        const newEthereumBalance = (isEthereum && !isHomeChain)
          ? toUserBalance.balanceEthereum + 1
          : toUserBalance.balanceEthereum;
        const newBeraBalance = isBerachain
          ? toUserBalance.balanceBerachain + 1
          : toUserBalance.balanceBerachain;
        const newMintedHome = (isMint && isHomeChain)
          ? toUserBalance.mintedHomeChain + 1
          : toUserBalance.mintedHomeChain;
        const newMintedEth = (isMint && isEthereum && !isHomeChain)
          ? toUserBalance.mintedEthereum + 1
          : toUserBalance.mintedEthereum;
        const newMintedBera = (isMint && isBerachain)
          ? toUserBalance.mintedBerachain + 1
          : toUserBalance.mintedBerachain;
        
        await UserBalance.update({
          id: toUserBalanceId,
          data: {
            balanceHomeChain: newHomeBalance,
            balanceEthereum: newEthereumBalance,
            balanceBerachain: newBeraBalance,
            balanceTotal: newHomeBalance + newEthereumBalance + newBeraBalance,
            mintedHomeChain: newMintedHome,
            mintedEthereum: newMintedEth,
            mintedBerachain: newMintedBera,
            mintedTotal: newMintedHome + newMintedEth + newMintedBera,
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
            balanceEthereum: (isEthereum && !isHomeChain) ? 1 : 0,
            balanceBerachain: isBerachain ? 1 : 0,
            balanceTotal: 1,
            mintedHomeChain: (isMint && isHomeChain) ? 1 : 0,
            mintedEthereum: (isMint && isEthereum && !isHomeChain) ? 1 : 0,
            mintedBerachain: (isMint && isBerachain) ? 1 : 0,
            mintedTotal: isMint ? 1 : 0,
            lastActivityTime: timestamp,
            firstMintTime: isMint ? timestamp : undefined,
          }
        });
      }
    }
  }
  
  // Track individual tokens for accurate supply counts
  const tokenId = event.args.tokenId;
  const tokenKey = `${collectionName}-${chainId}-${tokenId}`;
  
  // Handle token tracking
  const existingToken = await Token.findUnique({ id: tokenKey });
  
  if (isMint && !existingToken) {
    // Create new token record on mint
    await Token.create({
      id: tokenKey,
      data: {
        collection: collectionName,
        chainId: chainId,
        tokenId: tokenId,
        owner: to,
        isBurned: false,
        mintedAt: timestamp,
        lastTransferTime: timestamp,
      }
    });
  } else if (existingToken && !existingToken.isBurned) {
    // Update token owner on transfer
    await Token.update({
      id: tokenKey,
      data: {
        owner: isBurn ? ZERO_ADDRESS : (isToProxy ? proxyAddress || to : to),
        isBurned: isBurn,
        lastTransferTime: timestamp,
      }
    });
  }
  
  // Update collection stats with accurate counts
  // Skip stats update if this is a transfer to/from proxy contract (just moving between chains)
  if (!isToProxy && !isFromProxy) {
    const statsId = `${collectionName}-${chainId}`;
    const existingStats = await CollectionStat.findUnique({ id: statsId });
    
    if (existingStats) {
      // Calculate changes based on transfer type
      let supplyChange = 0;
      let mintedChange = 0;
      let burnedChange = 0;
      
      if (isMint) {
        supplyChange = 1;
        mintedChange = 1;
      } else if (isBurn) {
        supplyChange = -1;
        burnedChange = 1;
      }
      
      // Check if we need to update unique holders count
      const toHolderExists = !isBurn && !isToProxy && 
        await Holder.findUnique({ id: `${to}-${collectionName}-${chainId}` });
      const fromHolderBalance = !isMint && !isFromProxy && 
        await Holder.findUnique({ id: `${from}-${collectionName}-${chainId}` });
      
      let holderChange = 0;
      if (!isBurn && !toHolderExists) holderChange++; // New holder
      if (fromHolderBalance && fromHolderBalance.balance === 1) holderChange--; // Holder losing last token
      
      await CollectionStat.update({
        id: statsId,
        data: {
          totalSupply: Math.max(0, existingStats.totalSupply + supplyChange),
          totalMinted: existingStats.totalMinted + mintedChange,
          totalBurned: existingStats.totalBurned + burnedChange,
          uniqueHolders: Math.max(0, existingStats.uniqueHolders + holderChange),
          lastMintTime: isMint ? timestamp : existingStats.lastMintTime,
        }
      });
    } else if (isMint) {
      // Only create stats entry for actual mints
      await CollectionStat.create({
        id: statsId,
        data: {
          collection: collectionName,
          totalSupply: 1,
          totalMinted: 1,
          totalBurned: 0,
          uniqueHolders: 1,
          lastMintTime: timestamp,
          chainId: chainId,
        }
      });
    }
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

// Register handlers for Ethereum bridged HoneyJar contracts
ponder.on("HoneyJar2Eth:Transfer", async ({ event, context }) => {
  await handleTransfer(event, context, "HoneyJar2", 1);
});

ponder.on("HoneyJar3Eth:Transfer", async ({ event, context }) => {
  await handleTransfer(event, context, "HoneyJar3", 1);
});

ponder.on("HoneyJar4Eth:Transfer", async ({ event, context }) => {
  await handleTransfer(event, context, "HoneyJar4", 1);
});

ponder.on("HoneyJar5Eth:Transfer", async ({ event, context }) => {
  await handleTransfer(event, context, "HoneyJar5", 1);
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