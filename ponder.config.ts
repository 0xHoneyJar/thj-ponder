import { createConfig } from "@ponder/core";
import { http } from "viem";
import { HoneyJar1ABI } from "./abis/HoneyJar1";

export default createConfig({
  networks: {
    mainnet: {
      chainId: 1,
      transport: http(process.env.PONDER_RPC_URL_1 || "https://1.rpc.hypersync.xyz"),
    },
    arbitrum: {
      chainId: 42161,
      transport: http(process.env.PONDER_RPC_URL_42161 || "https://42161.rpc.hypersync.xyz"),
    },
    zora: {
      chainId: 7777777,
      transport: http(process.env.PONDER_RPC_URL_7777777 || "https://7777777.rpc.hypersync.xyz"),
    },
    optimism: {
      chainId: 10,
      transport: http(process.env.PONDER_RPC_URL_10 || "https://10.rpc.hypersync.xyz"),
    },
    base: {
      chainId: 8453,
      transport: http(process.env.PONDER_RPC_URL_8453 || "https://8453.rpc.hypersync.xyz"),
    },
  },
  contracts: {
    HoneyJar1: {
      network: "mainnet",
      abi: HoneyJar1ABI,
      address: "0xa20CF9B0874c3E46b344DEAEEa9c2e0C3E1db37d",
      startBlock: 17090027,
    },
    HoneyJar2: {
      network: "arbitrum",
      abi: HoneyJar1ABI, // Using same ABI for all HoneyJar contracts
      address: "0xc10028b428b130dFb3902348e292c35D0cc87610",
      startBlock: 19090027, // Adjust based on actual deployment
    },
    HoneyJar3: {
      network: "zora",
      abi: HoneyJar1ABI,
      address: "0xB3aE32BE889091617f37B0318074c7CC83270594",
      startBlock: 1000000, // Adjust based on actual deployment
    },
    HoneyJar4: {
      network: "optimism",
      abi: HoneyJar1ABI,
      address: "0xb50bBD37B04Dd506aD3632431faDe1a2fb7Bd90F",
      startBlock: 10000000, // Adjust based on actual deployment
    },
    HoneyJar5: {
      network: "base",
      abi: HoneyJar1ABI,
      address: "0xA5d3dD8C319279E0d87af0bd17a13C8EfBdaf7a4",
      startBlock: 1000000, // Adjust based on actual deployment
    },
    HoneyJar6: {
      network: "mainnet",
      abi: HoneyJar1ABI,
      address: "0xc6904FB685b4DFbD11B7b8063a2f6Fa996E8A0Ae",
      startBlock: 18090027, // Adjust based on actual deployment
    },
  },
});