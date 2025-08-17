import { createConfig } from "@ponder/core";
import { http } from "viem";

// Import ABIs
import { HoneyJar1ABI } from "./abis/HoneyJar1";

// Using HyperSync RPC for ultra-fast indexing
// HyperSync is optimized for historical data queries and can sync 100x faster than standard RPCs

// NFT Collection Configurations (Easily add more here)
const NFT_COLLECTIONS = {
  HJ1: {
    address: "0xa20CF9B0874c3E46b344DEAEEa9c2e0C3E1db37d" as const, // HoneyJar 1 contract
    startBlock: 17090027, // Actual HoneyJar 1 deployment block
  },
  // Future collections can be added here:
  // HJ2: {
  //   address: "0x...",
  //   startBlock: 21500000,
  // },
};

export default createConfig({
  // Network Configuration
  networks: {
    mainnet: {
      chainId: 1,
      transport: http(
        process.env.PONDER_RPC_URL_1 || 
        process.env.RPC_URL_MAINNET || 
        "https://1.rpc.hypersync.xyz" // HyperSync for super fast indexing
      ),
      // HyperSync can handle higher throughput
      pollingInterval: 2_000, // 2 seconds for faster updates
      maxRequestsPerSecond: 50, // HyperSync can handle more requests
    },
    // Uncomment for multi-chain support
    // berachain: {
    //   chainId: 80084,
    //   transport: http(process.env.PONDER_RPC_URL_80084),
    // },
  },

  // Contract Configurations
  contracts: {
    // HoneyJar 1 Contract
    HoneyJar1: {
      network: "mainnet",
      abi: HoneyJar1ABI,
      address: NFT_COLLECTIONS.HJ1.address,
      startBlock: NFT_COLLECTIONS.HJ1.startBlock,
      // Only track Transfer events (mints are Transfer events from 0x0 address)
    },

    // Template for adding more NFT contracts:
    // HoneyJar2: {
    //   network: "mainnet",
    //   abi: HoneyJar2ABI,
    //   address: NFT_COLLECTIONS.HJ2.address,
    //   startBlock: NFT_COLLECTIONS.HJ2.startBlock,
    // },
  },

  // Database Configuration
  // Automatically uses SQLite for local dev, Postgres in production with DATABASE_URL
});

// Export collection configs for use in indexing
export { NFT_COLLECTIONS };
