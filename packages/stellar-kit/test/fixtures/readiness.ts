/**
 * Shared transaction readiness fixtures for tests.
 *
 * Covers all readiness states: ready, warnings, blocked, unsafe-network,
 * plus funding/balance scenarios.
 */
import type {
  AccountBalanceModel,
  PaymentIntent,
  StellarPublicKey,
  TransactionReadiness,
} from "@anchorkit/types";

const SRC: StellarPublicKey =
  "GA2C5RFPE6GCKMY3K7AIGZ5ZBBX26Z5B3E6G7V4MMSZ5L2R5YHMBFQJJ" as StellarPublicKey;

const DST: StellarPublicKey =
  "GBMFNDXCRSOD7Y7FW5WJ6TZ6MMHCYQJK76Y5QM5T2DJG7QX4LM4LMFTO" as StellarPublicKey;

// ─── Intent fixtures ────────────────────────────────────────────────────────

export const READY_INTENT: PaymentIntent = {
  sourcePublicKey: SRC,
  destinationPublicKey: DST,
  asset: { type: "native", code: "XLM", issuer: null },
  amount: "10.0000000",
};

export const READY_INTENT_WITH_WARNINGS: PaymentIntent = {
  sourcePublicKey: SRC,
  destinationPublicKey: SRC, // same source/dest → warning
  asset: { type: "native", code: "XLM", issuer: null },
  amount: "10.0000000",
};

export const BLOCKED_INTENT_INVALID_ASSET = {
  sourcePublicKey: SRC,
  destinationPublicKey: DST,
  asset: { type: "native", code: "", issuer: null },
  amount: "10.0000000",
} as unknown as PaymentIntent;

export const BLOCKED_INTENT_BAD_AMOUNT = {
  sourcePublicKey: SRC,
  destinationPublicKey: DST,
  asset: { type: "native", code: "XLM", issuer: null },
  amount: "not-a-number",
} as unknown as PaymentIntent;

export const UNSAFE_NETWORK_INTENT: PaymentIntent = {
  sourcePublicKey: SRC,
  destinationPublicKey: DST,
  asset: { type: "native", code: "XLM", issuer: null },
  amount: "10.0000000",
};

export const INTENT_SOURCE_UNFUNDED: PaymentIntent = {
  sourcePublicKey: SRC,
  destinationPublicKey: DST,
  asset: { type: "native", code: "XLM", issuer: null },
  amount: "10.0000000",
};

export const INTENT_INSUFFICIENT_FUNDS: PaymentIntent = {
  sourcePublicKey: SRC,
  destinationPublicKey: DST,
  asset: { type: "native", code: "XLM", issuer: null },
  amount: "999.0000000",
};

// ─── Balance model fixtures ─────────────────────────────────────────────────

export const BALANCE_MODEL_KNOWN: AccountBalanceModel = {
  state: "known",
  total: "100.0000000",
  reserve: "2.5000000",
  spendable: "97.5000000",
  unavailable: "2.5000000",
  explanation: "Min balance 2.5 XLM (2 base + 3 subentries × 0.5).",
};

export const BALANCE_MODEL_LOW: AccountBalanceModel = {
  state: "known",
  total: "0.5000000",
  reserve: "1.0000000",
  spendable: "0.0000000",
  unavailable: "0.5000000",
  explanation: "Balance below minimum reserve. Nothing is spendable.",
};

export const BALANCE_MODEL_UNKNOWN: AccountBalanceModel = {
  state: "unknown",
  total: null,
  reserve: null,
  spendable: null,
  unavailable: null,
  explanation: "Account data is unavailable.",
};

// ─── Scenario presets ───────────────────────────────────────────────────────

export const READINESS_SCENARIOS = {
  ready: { intent: READY_INTENT, network: "testnet" as const },
  warnings: { intent: READY_INTENT_WITH_WARNINGS, network: "testnet" as const },
  blockedAsset: { intent: BLOCKED_INTENT_INVALID_ASSET, network: "testnet" as const },
  blockedAmount: { intent: BLOCKED_INTENT_BAD_AMOUNT, network: "testnet" as const },
  unsafeNetwork: { intent: UNSAFE_NETWORK_INTENT, network: "mainnet" as const },
  sourceUnfunded: {
    intent: INTENT_SOURCE_UNFUNDED,
    network: "testnet" as const,
    sourceAccountFunded: false,
  },
  insufficientFunds: {
    intent: INTENT_INSUFFICIENT_FUNDS,
    network: "testnet" as const,
    sourceBalances: BALANCE_MODEL_KNOWN,
  },
} as const;
