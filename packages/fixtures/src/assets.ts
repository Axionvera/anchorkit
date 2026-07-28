/**
 * Stellar asset fixtures (issue #59). Mirrors `examples/assets-*.json`.
 */

import type { IssuedAsset, NativeAsset, StellarAsset } from "@anchorkit/types";
import { DEMO_FUNDED_PUBLIC_KEY, DEMO_EURC_ISSUER_PUBLIC_KEY } from "./constants";

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

/** Issued asset not present in the default testnet registry — "unknown" state. */
export const sampleUnknownAsset: IssuedAsset = {
  type: "issued",
  code: "SOMELONG" as IssuedAsset["code"],
  issuer: DEMO_EURC_ISSUER_PUBLIC_KEY,
};

/** Issued asset that is registered but testnet-only — "unsupported" on mainnet. */
export const sampleUnsupportedAsset: StellarAsset = {
  type: "issued",
  code: "USDC",
  issuer: "GC5HTWCIAUD72MGI7AHMJEF5ZJRKXS7II2PYVYOJEYKN4UYH6QTPCPZV",
} as IssuedAsset;

/** Invalid asset-like object that fails structural validation. */
export const sampleInvalidAsset: unknown = {
  type: "issued",
  code: "",
  issuer: "not-a-valid-key",
};
