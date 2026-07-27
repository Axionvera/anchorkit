import type {
  AnchorTransactionRecord,
  AnchorTransactionStatus,
  DepositRequestMetadata,
  StellarPublicKey,
  WithdrawalRequestMetadata,
} from "@anchorkit/types";
import { createMockAnchorTransactionRecord } from "./index";

const FRIENDBOT: StellarPublicKey =
  "GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR" as StellarPublicKey;

const SAMPLE_TX_HASH =
  "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2" as const;

export const sampleDepositRequest: DepositRequestMetadata = {
  assetCode: "XLM",
  amount: "500.0000000",
  account: FRIENDBOT,
  memo: "AnchorTest-42",
  memoType: "text",
  railId: "sepa_eur_bank",
  emailAddress: "tester+sep@example.com",
  type: "SEPA",
};

export const sampleWithdrawalRequest: WithdrawalRequestMetadata = {
  assetCode: "USDC",
  amount: "250.75",
  account: FRIENDBOT,
  memo: "WITHDRAW-99",
  memoType: "text",
  railId: "ach_us_bank",
  dest: "US123456789012",
  destExtra: "ACCT-4421",
  type: "ACH",
};

export function buildDepositLifecycle(): AnchorTransactionRecord[] {
  const startedAt = new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString();
  const base = {
    kind: "deposit" as const,
    assetCode: "XLM",
    amountIn: "500.0000000",
    amountOut: "498.5000000",
    feeAmount: "1.5000000",
    stellarAccount: FRIENDBOT,
    startedAt,
    externalTransactionId: "SEPA-REF-0001",
  };

  const statuses: AnchorTransactionStatus[] = [
    "pending_user",
    "pending_anchor",
    "pending_stellar",
    "completed",
  ];

  return statuses.map((status, i) =>
    createMockAnchorTransactionRecord({
      ...base,
      id: `dep_lifecycle_${i + 1}`,
      status,
      stellarTransactionId:
        status === "pending_stellar" || status === "completed"
          ? (SAMPLE_TX_HASH as unknown as import("@anchorkit/types").StellarTransactionHash)
          : undefined,
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * (6 - i)).toISOString(),
      completedAt: status === "completed" ? new Date().toISOString() : undefined,
      message:
        status === "pending_user"
          ? "Please confirm the bank transfer details in the anchor portal."
          : status === "pending_anchor"
            ? "Anchor has received the bank transfer and is preparing the Stellar transaction."
            : status === "pending_stellar"
              ? "Stellar transaction submitted. Awaiting ledger confirmation."
              : "Deposit complete. XLM is now available in the Stellar account.",
      metadata: { step: i + 1, rail: "SEPA" },
    })
  );
}

export function buildWithdrawalLifecycle(): AnchorTransactionRecord[] {
  const startedAt = new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString();
  const base = {
    kind: "withdrawal" as const,
    assetCode: "USDC",
    amountIn: "250.75",
    amountOut: "248.75",
    feeAmount: "2.00",
    stellarAccount: FRIENDBOT,
    startedAt,
    externalTransactionId: "ACH-OUT-8812",
  };

  const records: AnchorTransactionRecord[] = [];
  const statuses: AnchorTransactionStatus[] = [
    "pending_user",
    "pending_stellar",
    "pending_anchor",
    "failed",
    "refunded",
  ];

  for (let i = 0; i < statuses.length; i++) {
    const status = statuses[i]!;
    records.push(
      createMockAnchorTransactionRecord({
        ...base,
        id: `with_lifecycle_${i + 1}`,
        status,
        stellarTransactionId:
          i >= 1 && i < 4
            ? (SAMPLE_TX_HASH as unknown as import("@anchorkit/types").StellarTransactionHash)
            : undefined,
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * (8 - i)).toISOString(),
        completedAt: status === "failed" || status === "refunded" ? new Date().toISOString() : undefined,
        refunded: status === "refunded",
        message:
          status === "failed"
            ? "External ACH transfer was rejected by the receiving bank."
            : status === "refunded"
              ? "USDC has been refunded to the originating Stellar account."
              : undefined,
        metadata: { step: i + 1, rail: "ACH", includeRefund: i === 4 },
      })
    );
  }

  return records;
}
