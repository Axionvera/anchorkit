/**
 * Shared asset fixtures for tests.
 *
 * Covers native XLM, issued assets, and edge cases.
 * No real issuer secrets are committed.
 */
import type { StellarAsset, StellarPublicKey } from "@anchorkit/types";

export const ISSUER: StellarPublicKey =
  "GA5ZSEJYB4J7FEWIOISDVX2ENQ3FAWQFS2ITYMYCU5Q3XTPTVNNROQZP" as StellarPublicKey;

export const ISSUER_2: StellarPublicKey =
  "GBFXOVIIP5GKONLMYYF2FRCEHLNEQA5PZMYLKLMQCOG7VNLBHOJQ3B2M" as StellarPublicKey;

// ─── Valid assets ───────────────────────────────────────────────────────────

export const NATIVE_ASSET: StellarAsset = {
  type: "native",
  code: "XLM",
  issuer: null,
};

export const ISSUED_ASSET_USDC: StellarAsset = {
  type: "issued",
  code: "USDC" as never,
  issuer: ISSUER,
};

export const ISSUED_ASSET_EURC: StellarAsset = {
  type: "issued",
  code: "EURC" as never,
  issuer: ISSUER_2,
};

// ─── Invalid / edge-case assets ─────────────────────────────────────────────

export const ISSUED_ASSET_WITH_INVALID_ISSUER = {
  type: "issued",
  code: "BAD",
  issuer: "NOT_A_VALID_KEY",
} as unknown as StellarAsset;

// ─── Arrays ─────────────────────────────────────────────────────────────────

export const ASSETS_ARRAY = [NATIVE_ASSET, ISSUED_ASSET_USDC, ISSUED_ASSET_EURC];
