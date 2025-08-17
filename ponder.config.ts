import { createConfig } from "@ponder/core";
import { http } from "viem";

// Import ABIs
import { HoneyJar1ABI } from "./abis/HoneyJar1";

// NFT Collection Configurations (Easily add more here)
const NFT_COLLECTIONS = {
  HJ1: {
    address: "0x0000000000000000000000000000000000000000", // TODO: Add actual HJ1 contract address
    startBlock: 21000000, // TODO: Add actual deployment block
    name: "Honey Jar 1 - Mint Mania",
    type: "raffle",
  },
  // Future collections can be added here:
  // HJ2: {
  //   address: "0x...",
  //   startBlock: 21500000,
  //   name: "Honey Jar 2",
  //   type: "raffle",
  // },
};

export default createConfig({
  // Network Configuration
  networks: {
    mainnet: {
      chainId: 1,
      transport: http(process.env.PONDER_RPC_URL_1 || "https://eth.llamarpc.com"),
      // Optional: Add rate limiting
      pollingInterval: 12_000, // 12 seconds
      maxRequestsPerSecond: 10,
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
      // Optional: Add specific event filters
      filter: {
        event: ["Transfer", "Mint", "Purchase"], // Adjust based on actual events
      },
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
  database: {
    kind: "postgres",
    // Local development uses SQLite by default
    // Production will use DATABASE_URL env variable
  },

  // Optional: API Configuration
  api: {
    port: parseInt(process.env.PORT || "42069"),
    // Enable GraphQL playground in development
    playground: process.env.NODE_ENV !== "production",
    // Custom routes will be added in src/api/
  },

  // Optional: Telemetry
  telemetry: {
    enabled: process.env.NODE_ENV === "production",
  },

  // Build Configuration
  build: {
    // Custom build directory
    buildDir: ".ponder",
  },
});

// Export collection configs for use in indexing
export { NFT_COLLECTIONS };