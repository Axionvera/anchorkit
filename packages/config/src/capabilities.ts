import type { ModuleCapability, PackageCapability } from "@anchorkit/types";

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
    state: "mock",
    description:
      "Step through an in-memory milestone and fixture events. The web page does not call or deploy the Rust contract.",
    docsHref: "/docs#escrow",
  },
  {
    id: "diagnostics",
    label: "Diagnostics",
    state: "unavailable",
    description:
      "The standalone dashboard module is not built; account diagnostics remain available on the Accounts page.",
    docsHref: "/docs#diagnostics",
  },
  {
    id: "network-config",
    label: "Network configuration",
    state: "unavailable",
    description:
      "Network presets exist in @anchorkit/config, but the standalone dashboard workflow is not built.",
    docsHref: "/docs#network-config",
  },
] as const;

export const CONFIG_PACKAGE_CAPABILITIES: PackageCapability = {
  packageName: "config",
  overallState: "implemented",
  features: [
    {
      id: "network-presets",
      label: "Network Presets",
      state: "implemented",
      description: "Define connection URLs, passphrases, and explorer links for testnet, mainnet, and futurenet.",
    },
    {
      id: "feature-flags",
      label: "Feature Flags",
      state: "implemented",
      description: "Define, query, and enforce default or runtime-enabled gates for experimental features.",
    },
    {
      id: "env-resolution",
      label: "Environment Resolution",
      state: "implemented",
      description: "Merge default settings with explicit configuration overrides and resolve metadata sources.",
    },
  ],
  docsHref: "/docs#config",
};

