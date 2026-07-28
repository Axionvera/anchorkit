/**
 * Shared secret / keypair fixtures for tests.
 *
 * RULE: No static secret keys are ever committed.
 * All secrets are generated at runtime to avoid secret scanner false positives.
 *
 * Well-known public keys (no corresponding secrets) are exported for use
 * in tests that need deterministic public key values.
 */

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Generate a fake Stellar-shaped secret key at runtime.
 * Starts with "S", 56 base32 characters. Not a real key — cannot sign.
 */
export function makeFakeSecret(): string {
  let s = "S";
  for (let i = 1; i < 56; i++) {
    s += BASE32[Math.floor(Math.random() * BASE32.length)];
  }
  return s;
}

/**
 * Generate a fake keypair at runtime.
 * Returns `{ publicKey, secretKey }` where both are structurally valid
 * but cryptographically meaningless.
 */
export function makeFakeKeypair(): { publicKey: string; secretKey: string } {
  let pk = "G";
  for (let i = 1; i < 56; i++) {
    pk += BASE32[Math.floor(Math.random() * BASE32.length)];
  }
  return { publicKey: pk, secretKey: makeFakeSecret() };
}

// ─── Well-known testnet public keys ─────────────────────────────────────────
// These are Friendbot-generated testnet accounts. No secrets are committed.

/** Stellar testnet Friendbot faucet account. */
export const FRIENDBOT_PUBLIC_KEY =
  "GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR";

/** Second well-known testnet account for source/destination pairs. */
export const FRIENDBOT_PUBLIC_KEY_2 =
  "GA2C5RFPE6GCKMY3K7AIGZ5ZBBX26Z5B3E6G7V4MMSZ5L2R5YHMBFQJJ";

// ─── Deterministic test values ──────────────────────────────────────────────

/** Valid 64-char hex transaction hash for tests. */
export const SAMPLE_TX_HASH =
  "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2";

/** Uppercase variant for case-sensitivity tests. */
export const SAMPLE_TX_HASH_UPPER = SAMPLE_TX_HASH.toUpperCase();
