/**
 * Stellar account fixtures (issue #59). Mirrors `examples/accounts-*.json`.
 */

import type { AccountInfo } from "@anchorkit/types";
import {
  DEMO_EURC_ISSUER_PUBLIC_KEY,
  DEMO_FUNDED_PUBLIC_KEY,
  DEMO_UNFUNDED_DESTINATION_PUBLIC_KEY,
  DEMO_UNFUNDED_PUBLIC_KEY,
  DEMO_UNFUNDED_WITHDRAWAL_PUBLIC_KEY,
  FRIENDBOT_PUBLIC_KEY,
} from "./constants";

/** Public well-known testnet friendbot operator — funded with native XLM only. */
export const sampleFriendbotAccount: AccountInfo = {
  publicKey: FRIENDBOT_PUBLIC_KEY,
  status: "funded",
  sequence: "123456789",
  subentryCount: 0,
  lastModifiedLedger: 100,
  balances: {
    native: "10000.0000000",
    assets: [],
  },
};

/** Funded demo account holding a native balance plus an issued USDC-like asset. */
export const sampleFundedAccountWithAsset: AccountInfo = {
  publicKey: DEMO_FUNDED_PUBLIC_KEY,
  status: "funded",
  sequence: "1",
  subentryCount: 1,
  lastModifiedLedger: 200,
  balances: {
    native: "500.0000000",
    assets: [
      {
        code: "USDC",
        issuer: DEMO_FUNDED_PUBLIC_KEY,
        balance: "1234.56",
        limit: "1000000",
      },
    ],
  },
};

/** Anchor-style demo account holding an issued EURC-like asset. */
export const sampleFundedEurcAccount: AccountInfo = {
  publicKey: DEMO_EURC_ISSUER_PUBLIC_KEY,
  status: "funded",
  sequence: "1",
  subentryCount: 1,
  lastModifiedLedger: 200,
  balances: {
    native: "120.1234567",
    assets: [
      {
        code: "EURC",
        issuer: DEMO_EURC_ISSUER_PUBLIC_KEY,
        balance: "5000.00",
        limit: "5000000",
      },
    ],
  },
};

/** Throwaway unfunded testnet identity generated for example purposes. */
export const sampleUnfundedAccount: AccountInfo = {
  publicKey: DEMO_UNFUNDED_PUBLIC_KEY,
  status: "unfunded",
};

/** Second unfunded demo account used for payment-destination fixtures. */
export const sampleUnfundedDestinationAccount: AccountInfo = {
  publicKey: DEMO_UNFUNDED_DESTINATION_PUBLIC_KEY,
  status: "unfunded",
};

/** Unfunded account used for anchor-utils withdrawal demos. */
export const sampleUnfundedWithdrawalAccount: AccountInfo = {
  publicKey: DEMO_UNFUNDED_WITHDRAWAL_PUBLIC_KEY,
  status: "unfunded",
};

/** All funded account fixtures, mirroring `examples/accounts-funded.json`. */
export const fundedAccounts: AccountInfo[] = [
  sampleFriendbotAccount,
  sampleFundedAccountWithAsset,
  sampleFundedEurcAccount,
];

/** All unfunded account fixtures, mirroring `examples/accounts-unfunded.json`. */
export const unfundedAccounts: AccountInfo[] = [
  sampleUnfundedAccount,
  sampleUnfundedDestinationAccount,
  sampleUnfundedWithdrawalAccount,
];
