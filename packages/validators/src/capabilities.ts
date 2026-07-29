import type { PackageCapability } from "@anchorkit/types";

export const VALIDATORS_PACKAGE_CAPABILITIES: PackageCapability = {
  packageName: "validators",
  overallState: "implemented",
  features: [
    {
      id: "stellar-schemas",
      label: "Stellar Schemas",
      state: "implemented",
      description: "Zod schemas for StellarPublicKey, StellarSecretKey, TransactionHash, Memo, Asset, Amount, and PaymentIntent.",
    },
    {
      id: "anchor-schemas",
      label: "Anchor Schemas",
      state: "implemented",
      description: "Zod schemas for AnchorTransactionStatus, AnchorTransactionKind, AssetConfig, RailConfig, Deposit/Withdrawal metadata, and CallbackUrl.",
    },
    {
      id: "escrow-schemas",
      label: "Escrow Schemas",
      state: "implemented",
      description: "Zod schemas for Milestone, EscrowSummary, and RawEscrowEvent validation.",
    },
    {
      id: "receipt-schemas",
      label: "Receipt Schemas",
      state: "implemented",
      description: "Zod schema for TransactionReceipt validation across payment, anchor, and escrow domains.",
    },
    {
      id: "validation-engine",
      label: "Validation Engine",
      state: "implemented",
      description: "Uniform ValidationResult type and engine validators that never throw, with mapped error codes.",
    },
  ],
  docsHref: "/docs#validators",
};
