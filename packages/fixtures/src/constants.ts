/**
 * Shared constants used across fixture modules (issue #59).
 *
 * Every value here is synthetic or public testnet data — never a real secret
 * key or a key that has ever held mainnet funds. See `docs/fixtures.md`.
 */

import type { StellarPublicKey, StellarTransactionHash } from "@anchorkit/types";

/** Public well-known testnet friendbot operator (public data, no secret). */
export const FRIENDBOT_PUBLIC_KEY: StellarPublicKey =
  "GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR" as StellarPublicKey;

/** Deterministic sample transaction hash (mirrors examples/*.json). */
export const SAMPLE_TX_HASH: StellarTransactionHash =
  "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2" as StellarTransactionHash;

/**
 * Synthetically derived testnet account marked funded for UI/demo fixtures.
 * Also doubles as the issuer for `sampleIssuedAsset` (USDC-like), mirroring
 * `examples/assets-issued-example.json`.
 */
export const DEMO_FUNDED_PUBLIC_KEY: StellarPublicKey =
  "GDQJUTQYK2MQ32ZGMMB7Q3UKTJLNTMZI2QYHW7OK2TK2DZI3X5IGQH6U" as StellarPublicKey;

/** Anchor-style demo account holding a stablecoin (EURC) issue. */
export const DEMO_EURC_ISSUER_PUBLIC_KEY: StellarPublicKey =
  "GCXKG6RN4ONIEPCMNFB732A436Z5PNDSRLGWK7XB65PK5EV6U5E4FZTS" as StellarPublicKey;

/** Throwaway unfunded testnet identity generated for example purposes. */
export const DEMO_UNFUNDED_PUBLIC_KEY: StellarPublicKey =
  "GA6V2F6Z2X73P4A3N4I4E433HNGKQ6QO7R6C77I65T4F63R3X2Y2QQQM" as StellarPublicKey;

/** Second unfunded demo account used for payment-destination fixtures. */
export const DEMO_UNFUNDED_DESTINATION_PUBLIC_KEY: StellarPublicKey =
  "GAAEOTAZHHSUFTB4E5XM56WQH2SHPDLOXEM3G57QRD453EF2FKY33JXE" as StellarPublicKey;

/** Unfunded account used for anchor-utils withdrawal demos. */
export const DEMO_UNFUNDED_WITHDRAWAL_PUBLIC_KEY: StellarPublicKey =
  "GCUWNYFZVZ4JQMWULZ5ZAO5YHVTTZKRSB7FJKWEFC4KTNGVGNWQS5HTP" as StellarPublicKey;

/** Escrow Soroban contract id used by stellar-kit's escrow-event fixtures. */
export const ESCROW_CONTRACT_ID =
  "CCESCROWAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAE";

/** Deterministic base timestamp (2026-01-01T00:00:00.000Z) used to derive fixture times. */
export const BASE_TIMESTAMP = "2026-01-01T00:00:00.000Z";
