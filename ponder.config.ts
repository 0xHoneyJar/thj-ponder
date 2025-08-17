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
      address: "0x68fFCb1B5F8e5d035c3B4bf49F8F139F49E45509",
      startBlock: 17085870,
    },
    HoneyJar2: {
      network: "arbitrum",
      abi: ERC721ABI,
      address: "0x37AA84e2B62A18894610227ACB4D3c77346D9c27",
      startBlock: 102870827,
    },
    HoneyJar3: {
      network: "zora",
      abi: ERC721ABI,
      address: "0x0a07048a9e1a278ae26c6fe99a51dc05fd1b8042",
      startBlock: 18071898,
    },
    HoneyJar4: {
      network: "optimism",
      abi: ERC721ABI,
      address: "0xdbafcb02eb30b2d292ee908bcee86a3c5e3603ad",
      startBlock: 125752962,
    },
    HoneyJar5: {
      network: "base",
      abi: ERC721ABI,
      address: "0xea1e7295639046944d5678304568e19d2994fd70",
      startBlock: 23252748,
    },
    HoneyJar6: {
      network: "mainnet",
      abi: ERC721ABI,
      address: "0x38c62DCb5bca6c3E8237A2c9C2e671252610F2A8",
      startBlock: 21642729,
    },
  },
});
