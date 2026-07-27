import { describe, it, expect } from "vitest";
import { Keypair } from "@stellar/stellar-base";
import {
  buildAccountLink,
  buildTransactionLink,
  parseTransactionHash,
  parseAccountId,
  explorerBaseUrl,
} from "../src/explorer";

// Use runtime-generated testnet keys/hashes — never static secrets.
const account = Keypair.random().publicKey();
const txHash = "d".repeat(64);

describe("explorer link builders", () => {
  it("builds a testnet account link", () => {
    expect(buildAccountLink(account, "testnet")).toBe(
      `https://stellar.expert/explorer/testnet/account/${account}`
    );
  });

  it("builds a mainnet account link", () => {
    expect(buildAccountLink(account, "mainnet")).toBe(
      `https://stellar.expert/explorer/public/account/${account}`
    );
  });

  it("builds a testnet transaction link", () => {
    expect(buildTransactionLink(txHash, "testnet")).toBe(
      `https://stellar.expert/explorer/testnet/tx/${txHash}`
    );
  });

  it("throws on invalid public key", () => {
    expect(() => buildAccountLink("not-a-key", "testnet")).toThrow();
  });

  it("throws on invalid tx hash", () => {
    expect(() => buildTransactionLink("zzz", "testnet")).toThrow();
  });

  it("exposes per-network base urls", () => {
    expect(explorerBaseUrl("testnet")).toContain("/testnet");
    expect(explorerBaseUrl("mainnet")).toContain("/public");
  });
});

describe("parseTransactionHash", () => {
  it("parses a valid hash", () => {
    const r = parseTransactionHash(txHash, "testnet");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.hash).toBe(txHash);
      expect(r.value.url).toContain(txHash);
    }
  });

  it("rejects a short/non-hex hash", () => {
    const r = parseTransactionHash("abc", "testnet");
    expect(r.ok).toBe(false);
  });
});

describe("parseAccountId", () => {
  it("parses a valid public key", () => {
    const r = parseAccountId(account, "testnet");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.account).toBe(account);
  });

  it("rejects an invalid account id", () => {
    const r = parseAccountId("G_BAD", "testnet");
    expect(r.ok).toBe(false);
  });
});
