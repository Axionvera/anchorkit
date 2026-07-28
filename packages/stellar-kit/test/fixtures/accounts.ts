/**
 * Shared account fixtures for tests.
 *
 * All public keys are deterministic testnet values or runtime-generated.
 * No real secret keys are used.
 */
import type { AccountInfo, StellarPublicKey } from "@anchorkit/types";

// Well-known testnet public keys (no corresponding secrets committed)
export const FUNDED_ACCOUNT: StellarPublicKey =
  "GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR" as StellarPublicKey;

export const UNFUNDED_ACCOUNT: StellarPublicKey =
  "GA2C5RFPE6GCKMY3K7AIGZ5ZBBX26Z5B3E6G7V4MMSZ5L2R5YHMBFQJJ" as StellarPublicKey;

// ─── AccountInfo objects ────────────────────────────────────────────────────

export const FUNDED_ACCOUNT_INFO: AccountInfo = {
  publicKey: FUNDED_ACCOUNT,
  status: "funded",
  sequence: "123",
  subentryCount: 3,
  balances: {
    native: "100.0000000",
    assets: [],
  },
};

export const FUNDED_ACCOUNT_INFO_WITH_ASSETS: AccountInfo = {
  publicKey: FUNDED_ACCOUNT,
  status: "funded",
  sequence: "456",
  subentryCount: 5,
  balances: {
    native: "250.5000000",
    assets: [
      {
        code: "USDC",
        issuer: "GA5ZSEJYB4J7FEWIOISDVX2ENQ3FAWQFS2ITYMYCU5Q3XTPTVNNROQZP",
        balance: "1000.0000000",
        limit: "100000.0000000",
      },
      {
        code: "EURC",
        issuer: "GBFXOVIIP5GKONLMYYF2FRCEHLNEQA5PZMYLKLMQCOG7VNLBHOJQ3B2M",
        balance: "500.0000000",
        limit: "50000.0000000",
      },
    ],
  },
};

export const UNFUNDED_ACCOUNT_INFO: AccountInfo = {
  publicKey: UNFUNDED_ACCOUNT,
  status: "unfunded",
};

export const NETWORK_ERROR_ACCOUNT_INFO: AccountInfo = {
  publicKey: FUNDED_ACCOUNT,
  status: "unknown",
  error: "request timed out",
};

export const ZERO_BALANCE_ACCOUNT_INFO: AccountInfo = {
  publicKey: FUNDED_ACCOUNT,
  status: "funded",
  sequence: "1",
  subentryCount: 0,
  balances: {
    native: "0.0000000",
    assets: [],
  },
};

export const LOW_BALANCE_ACCOUNT_INFO: AccountInfo = {
  publicKey: FUNDED_ACCOUNT,
  status: "funded",
  sequence: "1",
  subentryCount: 0,
  balances: {
    native: "0.5000000",
    assets: [],
  },
};

export const HIGH_SUBENTRY_ACCOUNT_INFO: AccountInfo = {
  publicKey: FUNDED_ACCOUNT,
  status: "funded",
  sequence: "999",
  subentryCount: 20,
  balances: {
    native: "500.0000000",
    assets: [],
  },
};

// ─── Arrays for schema validation tests ─────────────────────────────────────

export const FUNDED_ACCOUNTS_ARRAY = [
  { publicKey: FUNDED_ACCOUNT, status: "funded" },
  {
    publicKey: "GBMFNDXCRSOD7Y7FW5WJ6TZ6MMHCYQJK76Y5QM5T2DJG7QX4LM4LMFTO" as StellarPublicKey,
    status: "funded",
  },
  {
    publicKey: "GC2BKLYOOYPDEFJKLKY6FNNRQMGFLVHJKQRGNSSRRGSMPGF32LHCQVGF" as StellarPublicKey,
    status: "funded",
  },
];

export const UNFUNDED_ACCOUNTS_ARRAY = [
  { publicKey: UNFUNDED_ACCOUNT, status: "unfunded" },
  {
    publicKey: "GBNFWVIIP5GKONLMYYF2FRCEHLNEQA5PZMYLKLMQCOG7VNLBHOJQ3B2M" as StellarPublicKey,
    status: "unfunded",
  },
  {
    publicKey: "GASC5B4ZQ2D3J56KL5MKS4Y4FLH3MCJZPIFHC6TY7L5MN4Q6JZ6JZ6AB" as StellarPublicKey,
    status: "unfunded",
  },
];
