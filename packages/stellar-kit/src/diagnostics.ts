/**
 * Account diagnostics pipeline (issue #1).
 *
 * A single, reusable diagnostics surface used by packages, UI screens, tests,
 * and docs. It maps a raw public key or `AccountInfo` into a typed
 * `AccountDiagnostic` covering funded / unfunded / invalid / unavailable /
 * unknown states, attaches reserve (minimum-balance) awareness, and a safe
 * Stellar Expert link — without ever exposing secrets.
 */

import type { AccountInfo, AccountStatus, NetworkConfig, StellarPublicKey } from "@anchorkit/types";
import { getNetworkConfig } from "@anchorkit/config";
import { isPublicKeyValid } from "./keys";
import { buildAccountLink } from "./explorer";
import { loadAccount } from "./accounts";

/** Diagnostic states — superset of the raw `AccountStatus`. */
export type AccountDiagnosticState =
  | "funded"
  | "unfunded"
  | "invalid"
  | "unavailable"
  | "unknown";

/** Stellar base reserve (in XLM) as of the current protocol. */
export const BASE_RESERVE_XLM = 2;
/** Per-subentry reserve increment (in XLM). */
export const SUBENTRY_RESERVE_XLM = 0.5;

export interface ReserveInfo {
  /** Base reserve in XLM. */
  baseReserve: number;
  /** Number of subentries counted against the reserve. */
  subentryCount: number;
  /** Computed minimum balance (base + subentry increments + 2 base accounts). */
  minimumBalanceXlm: number;
  /** Human-readable explanation suitable for UI. */
  explanation: string;
}

/** Reserve awareness derived from an account's subentry count. */
export function computeReserve(subentryCount: number | undefined): ReserveInfo {
  const subs = subentryCount ?? 0;
  const minimumBalanceXlm = BASE_RESERVE_XLM + (subs + 2) * SUBENTRY_RESERVE_XLM;
  return {
    baseReserve: BASE_RESERVE_XLM,
    subentryCount: subs,
    minimumBalanceXlm,
    explanation: `Minimum balance is ${minimumBalanceXlm} XLM: ${BASE_RESERVE_XLM} base reserve + ${
      subs + 2
    } entries × ${SUBENTRY_RESERVE_XLM} XLM (2 base entries + ${subs} subentries).`,
  };
}

export interface AccountDiagnostic {
  /** The (possibly invalid) input the user supplied. */
  input: string;
  /** Normalized diagnostic state. */
  state: AccountDiagnosticState;
  /** Whether the input was a structurally valid public key. */
  isValidPublicKey: boolean;
  /** Stellar Expert link, or null when the key is invalid. */
  expertUrl: string | null;
  /** Reserve awareness (only meaningful for funded accounts). */
  reserve: ReserveInfo | null;
  /** Raw account info when available (never includes secrets). */
  account: AccountInfo | null;
  /** User-safe error message, if any. */
  error: string | null;
}

function mapStatusToState(status: AccountStatus): AccountDiagnosticState {
  switch (status) {
    case "funded":
      return "funded";
    case "unfunded":
      return "unfunded";
    case "unknown":
      return "unavailable";
    case "error":
      return "unavailable";
    default:
      return "unknown";
  }
}

/**
 * Synchronous diagnostics from an already-known `AccountInfo` (no network). Use
 * this in tests and when you already have account data. Never exposes secrets —
 * only the public key is carried through.
 */
export function diagnoseAccountInfo(
  info: AccountInfo,
  options: { network?: NetworkConfig["network"] } = {}
): AccountDiagnostic {
  const network = options.network ?? "testnet";
  const valid = isPublicKeyValid(info.publicKey);
  const state = mapStatusToState(info.status);
  const reserve = state === "funded" ? computeReserve(info.subentryCount) : null;

  return {
    input: info.publicKey,
    state,
    isValidPublicKey: valid,
    expertUrl: valid ? buildAccountLink(info.publicKey, network) : null,
    reserve,
    account: info,
    error: info.error ?? null,
  };
}

/**
 * Full async diagnostics pipeline: validates the key, loads the account over the
 * network (via `loadAccount`), and produces a typed `AccountDiagnostic`.
 * Network/parse failures degrade gracefully into `invalid` / `unavailable`
 * states instead of throwing.
 */
export async function diagnoseAccount(
  publicKey: string,
  options: { network?: NetworkConfig["network"]; loadAccount?: (pk: string) => Promise<AccountInfo> } = {}
): Promise<AccountDiagnostic> {
  const network = options.network ?? "testnet";

  if (!isPublicKeyValid(publicKey)) {
    return {
      input: publicKey,
      state: "invalid",
      isValidPublicKey: false,
      expertUrl: null,
      reserve: null,
      account: null,
      error: "Not a valid Stellar public key (must be 56 characters, start with G).",
    };
  }

  const loader = options.loadAccount;
  try {
    const info = loader
      ? await loader(publicKey)
      : await loadAccount(publicKey, { networkConfig: getNetworkConfig(network) });
    return diagnoseAccountInfo(info, { network });
  } catch (err) {
    return {
      input: publicKey,
      state: "unavailable",
      isValidPublicKey: true,
      expertUrl: buildAccountLink(publicKey as StellarPublicKey, network),
      reserve: null,
      account: null,
      error: err instanceof Error ? err.message : "Account diagnostics unavailable.",
    };
  }
}

