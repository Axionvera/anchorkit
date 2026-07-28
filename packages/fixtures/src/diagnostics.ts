/**
 * Deterministic `AccountInfo` fixtures for exercising account diagnostics
 * (issue #59). Plain, branded-cast objects — no network calls, no secrets.
 */

import type { AccountInfo } from "@anchorkit/types";
import { DEMO_FUNDED_PUBLIC_KEY, DEMO_UNFUNDED_PUBLIC_KEY, FRIENDBOT_PUBLIC_KEY } from "./constants";

/** Funded account with a subentry count, suitable for reserve-computation tests. */
export const diagnosticsFundedAccountInfo: AccountInfo = {
  publicKey: DEMO_FUNDED_PUBLIC_KEY,
  status: "funded",
  sequence: "123",
  subentryCount: 3,
  balances: { native: "100.0000000", assets: [] },
};

/** Unfunded account — no balances, no sequence. */
export const diagnosticsUnfundedAccountInfo: AccountInfo = {
  publicKey: DEMO_UNFUNDED_PUBLIC_KEY,
  status: "unfunded",
};

/** Account whose diagnostics are unavailable (e.g. a network timeout upstream). */
export const diagnosticsUnavailableAccountInfo: AccountInfo = {
  publicKey: FRIENDBOT_PUBLIC_KEY,
  status: "unknown",
  error: "request timed out",
};
