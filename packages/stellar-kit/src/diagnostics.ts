/**
 * Account diagnostics pipeline (issue #1).
 *
 * A single, reusable diagnostics surface used by packages, UI screens, tests,
 * and docs. It maps a raw public key or `AccountInfo` into a typed
 * `AccountDiagnostic` covering funded / unfunded / invalid / unavailable /
 * unknown states, attaches reserve (minimum-balance) awareness, and a safe
 * Stellar Expert link — without ever exposing secrets.
 */

import type {
  AccountBalanceModel,
  AccountInfo,
  AccountStatus,
  NetworkConfig,
  StellarPublicKey,
} from "@anchorkit/types";
import { getNetworkConfig } from "@anchorkit/config";
import { isPublicKeyValid } from "./keys";
import { buildAccountLink } from "./explorer";
import { loadAccount } from "./accounts";
import { computeBalanceModel, computeReserve, unknownBalanceModel } from "./balances";
import type { ReserveInfo } from "./balances";

export {
  BASE_ENTRY_COUNT,
  STELLAR_BASE_RESERVE_XLM,
  computeBalanceModel,
  computeReserve,
} from "./balances";
export type { ReserveInfo } from "./balances";

/** Diagnostic states — superset of the raw `AccountStatus`. */
export type AccountDiagnosticState =
  | "funded"
  | "unfunded"
  | "invalid"
  | "unavailable"
  | "unknown";

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
  /**
   * Total / reserve / spendable / unavailable breakdown of the native balance.
   * Always present; carries `state: "unknown"` with null amounts when the
   * account data does not support a trustworthy figure.
   */
  balances: AccountBalanceModel;
  /** Raw account info when available (never includes secrets). */
  account: AccountInfo | null;
  /** User-safe error message, if any. */
  error: string | null;
}

export interface ConfigDiagnostic {
  /** Safe configuration resolution metadata (secrets redacted). */
  configSources: ConfigSourceMetadata[];
  /** Feature flags metadata and current resolved state. */
  featureFlags: Array<{
    id: string;
    name: string;
    enabled: boolean;
    stability: string;
  }>;
  /** True if no experimental or deprecated features are active. */
  isAllStable: boolean;
  /** ISO timestamp when diagnostics were generated. */
  timestamp: string;
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
    input: valid ? info.publicKey : redactSecrets(info.publicKey),
    state,
    isValidPublicKey: valid,
    expertUrl: valid ? buildAccountLink(info.publicKey, network) : null,
    reserve,
    balances: computeBalanceModel(info),
    account: info,
    error: info.error ? redactSecrets(info.error) : null,
  };
}

/**
 * Full async diagnostics pipeline: validates the key, loads the account over the
 * network (via `loadAccount`), and produces a typed `AccountDiagnostic`.
 * Network/parse failures degrade gracefully into `invalid` / `unavailable`
 * states instead of throwing.
 */
export function diagnoseConfig(
  env: AnchorKitEnvConfig = DEFAULT_ENV_CONFIG
): ConfigDiagnostic {
  const configSources = resolveConfigSourceMetadata(env);
  const definitions = getFeatureFlagDefinitions();
  const featureFlags = definitions.map((def) => ({
    id: def.id,
    name: def.name,
    enabled: isFeatureEnabled(def.id, env),
    stability: def.stability,
  }));

  const enabledExperimentalOrDeprecated = featureFlags.some(
    (ff) => ff.enabled && ff.stability !== "stable"
  );

  return {
    configSources,
    featureFlags,
    isAllStable: !enabledExperimentalOrDeprecated,
    timestamp: new Date().toISOString(),
  };
}

export async function diagnoseAccount(
  publicKey: string,
  options: { network?: NetworkConfig["network"]; loadAccount?: (pk: string) => Promise<AccountInfo> } = {}
): Promise<AccountDiagnostic> {
  const network = options.network ?? "testnet";

  if (!isPublicKeyValid(publicKey)) {
    return {
      input: redactSecrets(publicKey),
      state: "invalid",
      isValidPublicKey: false,
      expertUrl: null,
      reserve: null,
      balances: unknownBalanceModel(
        "The public key is not valid, so no balance can be read for it."
      ),
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
      input: redactSecrets(publicKey),
      state: "unavailable",
      isValidPublicKey: true,
      expertUrl: buildAccountLink(publicKey as StellarPublicKey, network),
      reserve: null,
      balances: unknownBalanceModel(
        "The account could not be loaded, so the spendable balance is unknown."
      ),
      account: null,
      error: err instanceof Error ? redactSecrets(err.message) : "Account diagnostics unavailable.",
    };
  }
}



