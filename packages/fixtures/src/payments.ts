/**
 * Payment intent fixtures (issue #59). Mirrors `examples/payments-*.json`.
 *
 * `PaymentIntent` (from `@anchorkit/types`) has no `network` or
 * `expectedReadiness` fields — those are example-file-only metadata used by
 * `scripts/check-examples.mts`, so they're intentionally omitted here.
 */

import type { PaymentIntent } from "@anchorkit/types";
import { DEMO_FUNDED_PUBLIC_KEY, FRIENDBOT_PUBLIC_KEY } from "./constants";
import { sampleNativeAsset } from "./assets";

/** A payment intent that passes all validation. */
export const samplePaymentIntent: PaymentIntent = {
  sourcePublicKey: FRIENDBOT_PUBLIC_KEY,
  destinationPublicKey: DEMO_FUNDED_PUBLIC_KEY,
  asset: sampleNativeAsset,
  amount: "125.7500000",
  memo: {
    type: "text",
    value: "Invoice #42",
  },
};

/** A payment intent deliberately crafted to fail multiple validation checks. */
export const invalidPaymentIntent = {
  sourcePublicKey: "BAD-KEY-TOO-SHORT",
  destinationPublicKey: DEMO_FUNDED_PUBLIC_KEY,
  asset: {
    type: "issued",
    code: "",
    issuer: "NOT-A-VALID-PUBLIC-KEY",
  },
  amount: "-42",
  memo: {
    type: "text",
    value: "This is a memo that is deliberately more than 28 bytes long so validation fails.",
  },
} as unknown;
