import type { PackageCapability } from "@anchorkit/types";

export const STELLAR_KIT_CAPABILITIES: PackageCapability = {
  packageName: "stellar-kit",
  overallState: "testnet-only",
  features: [
    {
      id: "keys",
      label: "Keypair Management",
      state: "implemented",
      description: "Generate disposable keypairs, validate Stellar keys, and manage keys safely in memory.",
    },
    {
      id: "accounts",
      label: "Account Loader",
      state: "testnet-only",
      description: "Load detailed account info and sequence numbers from Horizon on Stellar Testnet.",
    },
    {
      id: "balances",
      label: "Spendable Balance Parser",
      state: "implemented",
      description: "Compute actual spendable XLM balance by subtracting locked base and subentry reserves.",
    },
    {
      id: "intent",
      label: "Payment Intent Builder",
      state: "implemented",
      description: "Validate fields for Stellar payments, including source/destination accounts, amounts, and memos.",
    },
    {
      id: "readiness",
      label: "Readiness Engine",
      state: "implemented",
      description: "Evaluate multi-stage transaction readiness, identifying network and account-level blockages.",
    },
    {
      id: "summary",
      label: "Transaction Summary Builder",
      state: "implemented",
      description: "Build review-before-action summaries for payment, anchor, and escrow preview screens.",
    },
    {
      id: "severity",
      label: "Severity Mapper",
      state: "implemented",
      description: "Map domain-specific status levels to visual badge tones, headlines, and recommended actions.",
    },
    {
      id: "redaction",
      label: "Secret Redaction",
      state: "implemented",
      description: "Detect and redact secret keys from logs, console messages, and errors to prevent leakage.",
    },
    {
      id: "soroban",
      label: "Soroban Support",
      state: "experimental",
      description: "Experimental RPC integrations and smart contract utilities.",
    },
    {
      id: "vault",
      label: "Vault Manager",
      state: "experimental",
      description: "Experimental session-tracked vault management for advanced escrow rules.",
    },
  ],
  docsHref: "/docs#stellar-kit",
};
