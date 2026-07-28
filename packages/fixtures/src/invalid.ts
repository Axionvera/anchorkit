/**
 * Deliberately invalid fixtures used to exercise validators and the
 * validation engine (issue #59). Migrated from
 * `packages/anchor-utils/src/fixtures.ts`.
 */

import { FRIENDBOT_PUBLIC_KEY } from "./constants";

/** Deposit metadata missing required `account` and with a non-positive amount. */
export const invalidDepositRequest = {
  assetCode: "XLM",
  amount: "0",
  // account omitted
  type: "SEPA",
} as unknown;

/** Withdrawal metadata with an invalid destination and bad amount format. */
export const invalidWithdrawalRequest = {
  assetCode: "USDC",
  amount: "not-a-number",
  account: FRIENDBOT_PUBLIC_KEY,
  dest: "",
  type: "ACH",
} as unknown;

/** Asset config with mismatched issuer length and disabled-but-enabled flags. */
export const invalidAnchorAssetConfig = {
  code: "USDC",
  issuer: "GTOOSHORT",
  schema: "stellar",
  enabled: false,
  depositEnabled: true,
  withdrawalEnabled: false,
} as unknown;

/** Plaintext (non-HTTPS, non-localhost) callback URL. */
export const invalidCallbackUrl = "http://example.com/callback";

/** Amount string that fails Stellar amount rules (too many decimals + zero). */
export const invalidAmount = "0.0000000001";

// `invalidPaymentIntent` lives in `./payments` (alongside `samplePaymentIntent`)
// and is re-exported from the package root via `index.ts`.
