import type { PaymentRequest } from "@anchorkit/types";
import { FRIENDBOT_PUBLIC_KEY } from "./secrets";

export const VALID_PAYMENT_REQUEST: PaymentRequest = {
  version: "1",
  destination: FRIENDBOT_PUBLIC_KEY as PaymentRequest["destination"],
  amount: "25.5000000",
  asset: { type: "native", code: "XLM", issuer: null },
  memo: { type: "text", value: "Invoice #84" },
  network: "testnet",
  metadata: {
    orderId: "order-84",
    refundable: true,
    lineItems: 2,
  },
  expiresAt: "2030-01-01T00:00:00Z",
};

export const EXPIRED_PAYMENT_REQUEST = {
  ...VALID_PAYMENT_REQUEST,
  expiresAt: "2024-01-01T00:00:00Z",
};

export const MALFORMED_PAYMENT_REQUEST = {
  ...VALID_PAYMENT_REQUEST,
  destination: "not-a-stellar-account",
  amount: "0",
  asset: { type: "native", code: "USD", issuer: null },
  memo: { type: "text", value: "x".repeat(29) },
  metadata: { nested: { unsafe: true } },
  expiresAt: "tomorrow",
};

export const UNSUPPORTED_PAYMENT_REQUEST = {
  ...VALID_PAYMENT_REQUEST,
  network: "public",
};
