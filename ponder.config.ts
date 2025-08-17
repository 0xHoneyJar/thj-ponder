import { createConfig } from "@ponder/core";
import { http } from "viem";
import { HoneyJar1ABI } from "./abis/HoneyJar1";

export default createConfig({
  networks: {
    mainnet: {
      chainId: 1,
      transport: http(process.env.PONDER_RPC_URL_1 || "https://1.rpc.hypersync.xyz"),
    },
  },
  contracts: {
    HoneyJar1: {
      network: "mainnet",
      abi: HoneyJar1ABI,
      address: "0xa20CF9B0874c3E46b344DEAEEa9c2e0C3E1db37d",
      startBlock: 17090027,
    },
  },
});