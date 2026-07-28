import type { ModuleCapability } from "@anchorkit/types";

export const MODULE_CAPABILITIES: readonly ModuleCapability[] = [
  {
    id: "accounts",
    label: "Accounts",
    state: "testnet-only",
    description: "Create testnet keypairs, validate keys, and load Horizon account data.",
    docsHref: "/docs#accounts",
  },
  {
    id: "payments",
    label: "Payments",
    state: "mock",
    description: "Build a payment intent and check readiness. Submission is a demo-mode mock.",
    docsHref: "/docs#payments",
  },
  {
    id: "anchors",
    label: "Anchors",
    state: "mock",
    description: "Mock deposit and withdrawal lifecycle with SEP-style status badges.",
    docsHref: "/docs#anchors",
  },
  {
    id: "escrow",
    label: "Escrow",
    state: "testnet-only",
    description: "Soroban treasury-escrow contract milestone workflow, deployed on testnet.",
    docsHref: "/docs#escrow",
  },
  {
    id: "diagnostics",
    label: "Diagnostics",
    state: "unavailable",
    description: "Network and account diagnostics tooling is not yet implemented.",
    docsHref: "/docs#diagnostics",
  },
  {
    id: "network-config",
    label: "Network configuration",
    state: "experimental",
    description: "Switch and inspect Stellar network configuration (testnet/futurenet).",
    docsHref: "/docs#network-config",
  },
] as const;
