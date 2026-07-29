import type { PackageCapability } from "@anchorkit/types";

export const FIXTURES_PACKAGE_CAPABILITIES: PackageCapability = {
  packageName: "fixtures",
  overallState: "implemented",
  features: [
    {
      id: "constants",
      label: "Well-Known Constants",
      state: "implemented",
      description: "Public testnet key constants including Friendbot and demo accounts for deterministic testing.",
    },
    {
      id: "account-fixtures",
      label: "Account Fixtures",
      state: "implemented",
      description: "Sample funded/unfunded account data with native and issued asset balances.",
    },
    {
      id: "asset-fixtures",
      label: "Asset Fixtures",
      state: "implemented",
      description: "Sample native and issued asset configurations for Stellar asset resolution tests.",
    },
    {
      id: "payment-fixtures",
      label: "Payment Fixtures",
      state: "implemented",
      description: "Sample payment intents and readiness pipeline data for payment testing.",
    },
    {
      id: "anchor-fixtures",
      label: "Anchor Fixtures",
      state: "implemented",
      description: "Sample anchor transaction records and lifecycle fixtures for deposit/withdrawal testing.",
    },
    {
      id: "escrow-fixtures",
      label: "Escrow Fixtures",
      state: "implemented",
      description: "Sample escrow milestones and event sequences for escrow workflow testing.",
    },
    {
      id: "diagnostics-fixtures",
      label: "Diagnostics Fixtures",
      state: "implemented",
      description: "Sample diagnostic pipeline results for account health and configuration checks.",
    },
    {
      id: "invalid-fixtures",
      label: "Invalid Input Fixtures",
      state: "implemented",
      description: "Intentionally invalid inputs for negative testing of validators and error handling.",
    },
  ],
  docsHref: "/docs#fixtures",
};
