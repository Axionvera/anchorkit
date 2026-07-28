/**
 * Shared payment intent fixtures for tests.
 *
 * Covers valid intents (native + issued assets, with/without memo),
 * invalid intents (bad keys, bad amounts, bad assets), and edge cases.
 */
import type { PaymentIntent, StellarPublicKey } from "@anchorkit/types";

const SRC: StellarPublicKey =
  "GA2C5RFPE6GCKMY3K7AIGZ5ZBBX26Z5B3E6G7V4MMSZ5L2R5YHMBFQJJ" as StellarPublicKey;

const DST: StellarPublicKey =
  "GBMFNDXCRSOD7Y7FW5WJ6TZ6MMHCYQJK76Y5QM5T2DJG7QX4LM4LMFTO" as StellarPublicKey;

const USDC_ISSUER: StellarPublicKey =
  "GA5ZSEJYB4J7FEWIOISDVX2ENQ3FAWQFS2ITYMYCU5Q3XTPTVNNROQZP" as StellarPublicKey;

// ─── Valid intents ──────────────────────────────────────────────────────────

export const VALID_PAYMENT_INTENT: PaymentIntent = {
  sourcePublicKey: SRC,
  destinationPublicKey: DST,
  asset: { type: "native", code: "XLM", issuer: null },
  amount: "10.0000000",
};

export const VALID_PAYMENT_INTENT_WITH_MEMO: PaymentIntent = {
  sourcePublicKey: SRC,
  destinationPublicKey: DST,
  asset: { type: "native", code: "XLM", issuer: null },
  amount: "125.7500000",
  memo: { type: "text", value: "AnchorTest-42" },
};

export const VALID_PAYMENT_INTENT_WITH_ID_MEMO: PaymentIntent = {
  sourcePublicKey: SRC,
  destinationPublicKey: DST,
  asset: { type: "native", code: "XLM", issuer: null },
  amount: "50.0000000",
  memo: { type: "id", value: "12345" },
};

export const VALID_PAYMENT_INTENT_ISSUED_ASSET: PaymentIntent = {
  sourcePublicKey: SRC,
  destinationPublicKey: DST,
  asset: { type: "issued", code: "USDC" as never, issuer: USDC_ISSUER },
  amount: "100.0000000",
};

// ─── Invalid intents ────────────────────────────────────────────────────────

export const INVALID_PAYMENT_INTENT_NO_SOURCE = {
  sourcePublicKey: "NOT_A_VALID_KEY",
  destinationPublicKey: DST,
  asset: { type: "native", code: "XLM", issuer: null },
  amount: "10.0000000",
} as unknown as PaymentIntent;

export const INVALID_PAYMENT_INTENT_BAD_AMOUNT = {
  sourcePublicKey: SRC,
  destinationPublicKey: DST,
  asset: { type: "native", code: "XLM", issuer: null },
  amount: "not-a-number",
} as unknown as PaymentIntent;

export const INVALID_PAYMENT_INTENT_BAD_ASSET = {
  sourcePublicKey: SRC,
  destinationPublicKey: DST,
  asset: { type: "native", code: "", issuer: null },
  amount: "10.0000000",
} as unknown as PaymentIntent;

export const INVALID_PAYMENT_INTENT_SELF_PAYMENT = {
  sourcePublicKey: SRC,
  destinationPublicKey: SRC,
  asset: { type: "native", code: "XLM", issuer: null },
  amount: "10.0000000",
};

// ─── Arrays for schema validation ───────────────────────────────────────────

export const PAYMENT_INTENTS_VALID_ARRAY = [
  VALID_PAYMENT_INTENT,
  VALID_PAYMENT_INTENT_WITH_MEMO,
  VALID_PAYMENT_INTENT_WITH_ID_MEMO,
  VALID_PAYMENT_INTENT_ISSUED_ASSET,
];

export const PAYMENT_INTENTS_INVALID_ARRAY = [
  INVALID_PAYMENT_INTENT_NO_SOURCE,
  INVALID_PAYMENT_INTENT_BAD_AMOUNT,
  INVALID_PAYMENT_INTENT_BAD_ASSET,
];
