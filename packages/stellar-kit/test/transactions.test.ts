import { describe, it, expect } from "vitest";
import {
  validateTransactionHash,
  isTransactionHashValid,
  normalizeTransactionHash,
  getStellarExpertAccountUrl,
  getStellarExpertTransactionUrl,
  getStellarExpertAssetUrl,
  getHorizonAccountUrl,
  getHorizonTransactionUrl,
} from "../src";

const FRIENDBOT = "GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR";
const VALID_HASH = "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";

describe("Transaction hash parsing", () => {
  it("accepts a lowercase 64-char hex string", () => {
    const r = validateTransactionHash(VALID_HASH);
    expect(r.success).toBe(true);
  });

  it("accepts uppercase 64-char hex string", () => {
    expect(isTransactionHashValid(VALID_HASH.toUpperCase())).toBe(true);
  });

  it("rejects strings that are not exactly 64 characters", () => {
    expect(isTransactionHashValid(VALID_HASH.slice(0, 63))).toBe(false);
    expect(isTransactionHashValid(VALID_HASH + "a")).toBe(false);
  });

  it("rejects non-hex content", () => {
    expect(isTransactionHashValid("g".repeat(64))).toBe(false);
    expect(isTransactionHashValid("Z".repeat(64))).toBe(false);
    expect(isTransactionHashValid("")).toBe(false);
  });

  it("normalizeTransactionHash lowercases and trims", () => {
    expect(normalizeTransactionHash("  " + VALID_HASH.toUpperCase() + "  ")).toBe(VALID_HASH);
  });
});

describe("Stellar Expert link generation", () => {
  it("generates testnet account URL for a valid public key", () => {
    const url = getStellarExpertAccountUrl(FRIENDBOT, "testnet");
    expect(url).toBe(
      `https://stellar.expert/explorer/testnet/account/${encodeURIComponent(FRIENDBOT)}`
    );
  });

  it("generates mainnet transaction URL and lowercases the hash", () => {
    const url = getStellarExpertTransactionUrl(VALID_HASH.toUpperCase(), "mainnet");
    expect(url).toBe(
      `https://stellar.expert/explorer/public/tx/${VALID_HASH}`
    );
  });

  it("generates asset URL with code and issuer path segments", () => {
    const url = getStellarExpertAssetUrl("USDC", FRIENDBOT, "testnet");
    expect(url).toBe(
      `https://stellar.expert/explorer/testnet/asset/USDC/${encodeURIComponent(FRIENDBOT)}`
    );
  });

  it("returns null for invalid public keys or bad asset codes, never throws", () => {
    expect(getStellarExpertAccountUrl("BADKEY", "testnet")).toBeNull();
    expect(getStellarExpertTransactionUrl("BADHASH", "testnet")).toBeNull();
    expect(getStellarExpertAssetUrl("", FRIENDBOT, "testnet")).toBeNull();
    expect(getStellarExpertAssetUrl("TOOLONGCODE12345", FRIENDBOT, "testnet")).toBeNull();
    expect(getStellarExpertAssetUrl("XLM", "BADISSUER", "testnet")).toBeNull();
  });

  it("Horizon URLs follow the same pattern", () => {
    expect(getHorizonAccountUrl(FRIENDBOT, "testnet")).toContain("/horizon-testnet.stellar.org/accounts/");
    expect(getHorizonTransactionUrl(VALID_HASH, "testnet")).toContain(
      "/horizon-testnet.stellar.org/transactions/" + VALID_HASH
    );
    expect(getHorizonAccountUrl("BAD", "testnet")).toBeNull();
  });
});
