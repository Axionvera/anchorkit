/**
 * Stellar Expert explorer links + transaction hash parsing (issue #10).
 *
 * Network-aware helpers for building account/transaction URLs on
 * stellar.expert, plus a parser/validator for transaction hashes and public
 * keys. No explorer URLs are hardcoded in the UI — everything routes through
 * here so testnet/mainnet behaviour is centrally configurable.
 */

import { StellarPublicKeySchema, StellarTransactionHashSchema } from "@anchorkit/validators";
import type { StellarNetwork } from "@anchorkit/types";

/** Base stellar.expert host per network. */
const EXPLORER_BASE: Record<StellarNetwork, string> = {
  testnet: "https://stellar.expert/explorer/testnet",
  mainnet: "https://stellar.expert/explorer/public",
  futurenet: "https://stellar.expert/explorer/futurenet",
};

export function explorerBaseUrl(network: StellarNetwork): string {
  return EXPLORER_BASE[network] ?? EXPLORER_BASE.testnet;
}

/** Build a Stellar Expert account link for a public key. */
export function buildAccountLink(publicKey: string, network: StellarNetwork = "testnet"): string {
  const parsed = StellarPublicKeySchema.safeParse(publicKey);
  if (!parsed.success) {
    throw new Error("Cannot build account link: invalid Stellar public key");
  }
  return `${explorerBaseUrl(network)}/account/${parsed.data}`;
}

/** Build a Stellar Expert transaction link for a transaction hash. */
export function buildTransactionLink(txHash: string, network: StellarNetwork = "testnet"): string {
  const parsed = StellarTransactionHashSchema.safeParse(txHash);
  if (!parsed.success) {
    throw new Error("Cannot build transaction link: invalid transaction hash");
  }
  return `${explorerBaseUrl(network)}/tx/${parsed.data}`;
}

export interface ParsedTransactionHash {
  hash: string;
  network: StellarNetwork;
  url: string;
}

/**
 * Parse a transaction hash into a typed result. Returns a safe failure object
 * (never throws) so callers can branch without try/catch.
 */
export function parseTransactionHash(
  input: string,
  network: StellarNetwork = "testnet"
): { ok: true; value: ParsedTransactionHash } | { ok: false; error: string } {
  const normalized = input.trim();
  const res = StellarTransactionHashSchema.safeParse(normalized);
  if (!res.success) {
    return { ok: false, error: "Transaction hash must be a 64-character hex string" };
  }
  return {
    ok: true,
    value: {
      hash: res.data,
      network,
      url: buildTransactionLink(res.data, network),
    },
  };
}

/**
 * Parse an account identifier (public key) into a typed result. Safe variant
 * of `buildAccountLink`.
 */
export function parseAccountId(
  input: string,
  network: StellarNetwork = "testnet"
): { ok: true; value: { account: string; network: StellarNetwork; url: string } } | { ok: false; error: string } {
  const normalized = input.trim();
  const res = StellarPublicKeySchema.safeParse(normalized);
  if (!res.success) {
    return { ok: false, error: "Account id must be a valid Stellar public key (starts with G)" };
  }
  return {
    ok: true,
    value: { account: res.data, network, url: buildAccountLink(res.data, network) },
  };
}
