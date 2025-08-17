import { createConfig } from "@ponder/core";
import { http } from "viem";
import { ERC721ABI } from "./abis/ERC721";

export default createConfig({
  networks: {
    mainnet: {
      chainId: 1,
      transport: http(
        process.env.PONDER_RPC_URL_1 || "https://1.rpc.hypersync.xyz"
      ),
    },
    arbitrum: {
      chainId: 42161,
      transport: http(
        process.env.PONDER_RPC_URL_42161 || "https://42161.rpc.hypersync.xyz"
      ),
    },
    zora: {
      chainId: 7777777,
      transport: http(
        process.env.PONDER_RPC_URL_7777777 ||
          "https://7777777.rpc.hypersync.xyz"
      ),
    },
    optimism: {
      chainId: 10,
      transport: http(
        process.env.PONDER_RPC_URL_10 || "https://10.rpc.hypersync.xyz"
      ),
    },
    base: {
      chainId: 8453,
      transport: http(
        process.env.PONDER_RPC_URL_8453 || "https://8453.rpc.hypersync.xyz"
      ),
    },
  },
  contracts: {
    HoneyJar1: {
      network: "mainnet",
      abi: ERC721ABI,
      address: "0xa20CF9B0874c3E46b344DEAEEa9c2e0C3E1db37d",
      startBlock: 17085870,
    },
    HoneyJar2: {
      network: "arbitrum",
      abi: ERC721ABI,
      address: "0x1b2751328F41D1A0b91f3710EDcd33E996591B72",
      startBlock: 102894033,
    },
    HoneyJar3: {
      network: "zora",
      abi: ERC721ABI,
      address: "0xE798c4D40BC050bc93c7F3B149A0dFE5cfC49Fb0",
      startBlock: 18071873,
    },
    HoneyJar4: {
      network: "optimism",
      abi: ERC721ABI,
      address: "0xe1D16Cc75C9f39A2e0f5131eB39d4b634b23F301",
      startBlock: 125752663,
    },
    HoneyJar5: {
      network: "base",
      abi: ERC721ABI,
      address: "0xbAd7B49D985bbFd3A22706c447Fb625A28f048B4",
      startBlock: 23252723,
    },
    HoneyJar6: {
      network: "mainnet",
      abi: ERC721ABI,
      address: "0x98Dc31A9648F04E23e4E36B0456D1951531C2a05",
      startBlock: 21642711,
    },
  },
});
