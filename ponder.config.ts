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
    berachain: {
      chainId: 80094,
      transport: http(
        process.env.PONDER_RPC_URL_80094 || "https://80094.rpc.hypersync.xyz"
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
    // Berachain HoneyJar contracts
    HoneyJar1Bera: {
      network: "berachain",
      abi: ERC721ABI,
      address: "0xEDC5dfd6f37464Cc91bbCE572b6fE2C97F1BC7b3",
      startBlock: 866405,
    },
    HoneyJar2Bera: {
      network: "berachain",
      abi: ERC721ABI,
      address: "0x1c6c24caC266c791C4BA789C3EC91F04331725bd",
      startBlock: 866405,
    },
    HoneyJar3Bera: {
      network: "berachain",
      abi: ERC721ABI,
      address: "0xF1E4A550772faBfc35B28b51eB8d0b6FCd1c4878",
      startBlock: 866405,
    },
    HoneyJar4Bera: {
      network: "berachain",
      abi: ERC721ABI,
      address: "0xdB602aB4D6bD71C8d11542A9C8c936877a9A4f45",
      startBlock: 866405,
    },
    HoneyJar5Bera: {
      network: "berachain",
      abi: ERC721ABI,
      address: "0x0263728e7F59F315c17d3C180aEade027a375F17",
      startBlock: 866405,
    },
    HoneyJar6Bera: {
      network: "berachain",
      abi: ERC721ABI,
      address: "0xb62a9A21D98478F477e134E175Fd2003C15Cb83A",
      startBlock: 866405,
    },
    // Honeycomb contracts
    HoneycombEth: {
      network: "mainnet",
      abi: ERC721ABI,
      address: "0xcb0477d1af5b8b05795d89d59f4667b59eae9244",
      startBlock: 21804976,
    },
    HoneycombBera: {
      network: "berachain",
      abi: ERC721ABI,
      address: "0x886D2176D899796cD1AfFA07Eff07B9b2B80f1be",
      startBlock: 866405,
    },
    // MoneycombVault contract on Berachain
    MoneycombVault: {
      network: "berachain",
      abi: [
        // Account events
        {
          type: "event",
          name: "AccountOpened",
          inputs: [
            { name: "user", type: "address", indexed: true },
            { name: "accountIndex", type: "uint256", indexed: true },
            { name: "honeycombId", type: "uint256", indexed: true },
          ],
        },
        {
          type: "event",
          name: "AccountClosed",
          inputs: [
            { name: "user", type: "address", indexed: true },
            { name: "accountIndex", type: "uint256", indexed: true },
            { name: "honeycombId", type: "uint256", indexed: true },
          ],
        },
        {
          type: "event",
          name: "HJBurned",
          inputs: [
            { name: "user", type: "address", indexed: true },
            { name: "accountIndex", type: "uint256", indexed: true },
            { name: "hjGen", type: "uint256", indexed: true },
          ],
        },
        {
          type: "event",
          name: "SharesMinted",
          inputs: [
            { name: "user", type: "address", indexed: true },
            { name: "accountIndex", type: "uint256", indexed: false },
            { name: "shares", type: "uint256", indexed: false },
          ],
        },
        {
          type: "event",
          name: "RewardClaimed",
          inputs: [
            { name: "user", type: "address", indexed: true },
            { name: "reward", type: "uint256", indexed: false },
          ],
        },
      ],
      address: "0x9279B2227B57f349A0CE552B25Af341e735f6309", // Test vault contract
      startBlock: 866405,
    },
  },
});
