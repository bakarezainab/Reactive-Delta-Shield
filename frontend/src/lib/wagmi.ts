import { createConfig, http } from "wagmi";
import { arbitrum, base, mainnet } from "wagmi/chains";
import { injected, metaMask, coinbaseWallet } from "wagmi/connectors";

export const config = createConfig({
  chains: [mainnet, arbitrum, base],
  connectors: [
    injected(),
    metaMask(),
    coinbaseWallet({ appName: "Reactive Delta-Shield" }),
  ],
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
  },
});

// ABI fragments for the ReactiveDeltaShieldHook
export const HOOK_ABI = [
  {
    name: "hedgeFeeFraction",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint24" }],
  },
  {
    name: "leverage",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "paused",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bool" }],
  },
  {
    name: "owner",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    name: "reactiveVmAddress",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    name: "perpDex",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    name: "setHedgeFeeFraction",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "_newFraction", type: "uint24" }],
    outputs: [],
  },
  {
    name: "setLeverage",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "_newLeverage", type: "uint256" }],
    outputs: [],
  },
  {
    name: "setPaused",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "_paused", type: "bool" }],
    outputs: [],
  },
  {
    name: "HedgeOpened",
    type: "event",
    inputs: [
      { name: "poolId", type: "bytes32", indexed: true },
      { name: "positionId", type: "bytes32", indexed: false },
      { name: "isShort", type: "bool", indexed: false },
      { name: "marginAmount", type: "uint256", indexed: false },
    ],
  },
  {
    name: "HedgeClosed",
    type: "event",
    inputs: [
      { name: "poolId", type: "bytes32", indexed: true },
      { name: "positionId", type: "bytes32", indexed: false },
      { name: "payoutAmount", type: "uint256", indexed: false },
    ],
  },
  {
    name: "FeeAccumulated",
    type: "event",
    inputs: [
      { name: "poolId", type: "bytes32", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
] as const;
