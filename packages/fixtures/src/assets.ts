/**
 * Stellar asset fixtures (issue #59). Mirrors `examples/assets-*.json`.
 */

import type { IssuedAsset, NativeAsset } from "@anchorkit/types";
import { DEMO_FUNDED_PUBLIC_KEY } from "./constants";

/** Native XLM asset descriptor. */
export const sampleNativeAsset: NativeAsset = {
  type: "native",
  code: "XLM",
  issuer: null,
};

/** Example issued asset (USDC-like) with a synthetic testnet issuer. */
export const sampleIssuedAsset: IssuedAsset = {
  type: "issued",
  code: "USDC" as IssuedAsset["code"],
  issuer: DEMO_FUNDED_PUBLIC_KEY,
};
