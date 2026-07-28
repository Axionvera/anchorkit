export type StellarNetwork = "testnet" | "mainnet" | "futurenet";

export const STELLAR_NETWORKS = {
  TESTNET: "testnet" as StellarNetwork,
  MAINNET: "mainnet" as StellarNetwork,
  FUTURENET: "futurenet" as StellarNetwork,
} as const;

export interface NetworkConfig {
  network: StellarNetwork;
  horizonUrl: string;
  sorobanRpcUrl?: string;
  networkPassphrase: string;
  friendlyName: string;
  isMainnet: boolean;
  expertBaseUrl: string;
}

export type StellarPublicKey = string & { readonly __brand: "StellarPublicKey" };
export type StellarSecretKey = string & { readonly __brand: "StellarSecretKey" };
export type StellarTransactionHash = string & { readonly __brand: "StellarTransactionHash" };
export type StellarMemoText = string & { readonly __brand: "StellarMemoText" };

export interface StellarKeypair {
  publicKey: StellarPublicKey;
  secretKey: StellarSecretKey;
}

export interface RedactedSecretKey {
  readonly __redacted: true;
  readonly prefix: string;
  readonly suffix: string;
}

export type AssetCode = string & { readonly __brand: "AssetCode" };
export type AssetIssuer = StellarPublicKey;

export interface NativeAsset {
  type: "native";
  code: "XLM";
  issuer: null;
}

export interface IssuedAsset {
  type: "issued";
  code: AssetCode;
  issuer: AssetIssuer;
}

export type StellarAsset = NativeAsset | IssuedAsset;

export interface AccountBalances {
  native: string;
  assets: Array<{
    code: string;
    issuer: string;
    balance: string;
    limit?: string;
  }>;
}

export type AccountStatus = "funded" | "unfunded" | "unknown" | "error";

export interface AccountInfo {
  publicKey: StellarPublicKey;
  status: AccountStatus;
  sequence?: string;
  subentryCount?: number;
  balances?: AccountBalances;
  lastModifiedLedger?: number;
  error?: string;
}

/**
 * Whether the spendable balance model could be derived at all.
 *
 * `unknown` is not "zero": it means the account data needed to compute a
 * balance is missing or unreliable, so every amount is `null` rather than a
 * number that would overstate what the user can actually spend.
 */
export type BalanceModelState = "known" | "unknown";

/**
 * Native (XLM) balance broken down into what is actually spendable.
 *
 * All amounts are decimal strings normalized to 7 decimal places (Stellar's
 * precision), or `null` when `state` is `"unknown"`. The invariant
 * `spendable + unavailable === total` holds for every `"known"` model.
 *
 * `spendable` excludes the minimum balance but NOT selling liabilities, which
 * Horizon reports but `AccountBalances` does not carry. It is therefore an
 * upper bound for accounts with open offers.
 */
export interface AccountBalanceModel {
  state: BalanceModelState;
  /** Total native balance held by the account. */
  total: string | null;
  /** Minimum balance locked by the protocol reserve. */
  reserve: string | null;
  /** Total minus reserve, never negative. */
  spendable: string | null;
  /** The portion of the total that cannot be spent (equals the locked reserve). */
  unavailable: string | null;
  /** Human-readable explanation suitable for UI. Contains no amounts when unknown. */
  explanation: string;
}

export interface PaymentIntent {
  sourcePublicKey: StellarPublicKey;
  destinationPublicKey: StellarPublicKey;
  asset: StellarAsset;
  amount: string;
  memo?: MemoInput;
}

export type MemoType = "none" | "text" | "id" | "hash" | "return";

export interface MemoInput {
  type: MemoType;
  value: string;
}

export interface ReadinessWarning {
  code: string;
  message: string;
  severity: "error" | "warning" | "info";
  stage?: ReadinessStageId;
}

export type TransactionReadinessState = "valid" | "invalid" | "blocked" | "warning" | "unavailable";

export type ReadinessStageId = "network" | "account" | "asset" | "amount" | "memo";

export interface ReadinessStageResult {
  stage: ReadinessStageId;
  state: TransactionReadinessState;
  message: string;
  details?: Record<string, unknown>;
}

export interface ReadinessIssue {
  code: string;
  stage: ReadinessStageId;
  severity: "error" | "warning" | "info";
  message: string;
  field?: string;
}

/**
 * Discrete readiness outcome. Superset of the boolean `ready` flag so callers
 * and UI can branch on a single typed value:
 * - "ready"         — no warnings at all.
 * - "warnings"      — only non-blocking warnings (e.g. same src/dest).
 * - "unsafe-network"— a mainnet/network-safety blocker is present.
 * - "blocked"       — one or more hard errors (invalid key, bad asset, etc.).
 */
export type ReadinessState = "ready" | "warnings" | "unsafe-network" | "blocked";

/**
 * Generic, domain-agnostic UI validation lifecycle state for forms (e.g. the
 * payment intent builder and anchor deposit/withdrawal forms).
 *
 * Unlike {@link TransactionReadinessState} and {@link ReadinessState} (which
 * describe the outcome of a specific readiness pipeline), `ValidationUIState`
 * is the shared vocabulary a form's UI renders against. Domain pipelines map
 * their own outcomes onto this state rather than being replaced by it:
 *
 * - "loading"  — validation/derivation is in flight; no outcome yet.
 * - "invalid"  — the input is structurally wrong and must be corrected.
 * - "warning"  — the input is valid but has a non-blocking issue to review.
 * - "ready"    — validation passed with no issues; safe to submit.
 * - "blocked"  — valid input, but an external/policy condition (e.g.
 *                mainnet safety, an unavailable diagnostic) prevents
 *                proceeding right now.
 */
/** All {@link ValidationUIState} values, in priority order (highest first). */
export const VALIDATION_UI_STATES = ["loading", "invalid", "blocked", "warning", "ready"] as const;

export type ValidationUIState = (typeof VALIDATION_UI_STATES)[number];

/** A single validation stage of the readiness engine. */
export interface ReadinessStage {
  /** Stable stage id, e.g. "account-source". */
  id: string;
  /** Human-readable label for UI. */
  label: string;
  /** Stage outcome derived from its warnings. */
  status: "pass" | "warn" | "fail";
  /** Warnings produced by this stage. */
  warnings: ReadinessWarning[];
}

export interface TransactionReadiness {
  /** Deprecated-friendly boolean: true when there are no error-severity warnings. */
  ready: boolean;
  /** Typed aggregate state. */
  state: ReadinessState;
  warnings: ReadinessWarning[];
  /** Per-stage results, in execution order. */
  stages: ReadinessStage[];
  summary: string;
  sourceDiagnostic?: unknown;
  destDiagnostic?: unknown;
}

/**
 * Normalized post-submit transaction outcome for cross-surface UI.
 *
 * Distinct from `AnchorTransactionStatus` (SEP lifecycle) and `ReadinessState`
 * (pre-submit validation). Use this when displaying confirmed, pending, failed,
 * rejected, or unknown outcomes consistently across payment, anchor, and escrow
 * screens.
 */
export type TransactionReceiptStatus = "confirmed" | "pending" | "failed" | "rejected" | "unknown";

export const TRANSACTION_RECEIPT_STATUSES: readonly TransactionReceiptStatus[] = [
  "confirmed",
  "pending",
  "failed",
  "rejected",
  "unknown",
] as const;

/** Where a receipt was derived from. */
export type TransactionReceiptSource = "payment" | "anchor" | "escrow" | "other";

export interface TransactionReceipt {
  /** Stable receipt id (anchor tx id, mock id, etc.). */
  id: string;
  /** Normalized outcome status for cross-surface UI. */
  status: TransactionReceiptStatus;
  /** Network the transaction was submitted on. */
  network: StellarNetwork;
  /** Human-readable headline for UI. */
  headline: string;
  /** Optional longer detail message. */
  detail?: string;
  /** Where this receipt originated. */
  source: TransactionReceiptSource;
  /** On-chain Stellar transaction hash, when known. */
  transactionHash?: StellarTransactionHash;
  /** Network-aware Stellar Expert link, when `transactionHash` is present. */
  explorerUrl?: string;
  /** ISO-8601 timestamps. */
  submittedAt?: string;
  finalizedAt?: string;
  /** Error classification when status is failed or rejected. */
  errorCode?: string;
  errorMessage?: string;
  /** Additional context (anchor id, milestone id, etc.). */
  metadata?: Record<string, unknown>;
}

export type AnchorTransactionStatus =
  | "pending_user"
  | "pending_anchor"
  | "pending_stellar"
  | "completed"
  | "failed"
  | "refunded";

export const ANCHOR_TRANSACTION_STATUSES: readonly AnchorTransactionStatus[] = [
  "pending_user",
  "pending_anchor",
  "pending_stellar",
  "completed",
  "failed",
  "refunded",
] as const;

export type AnchorTransactionKind = "deposit" | "withdrawal";

export interface AnchorAssetConfig {
  code: string;
  issuer: string;
  schema: "stellar" | "iso4217";
  enabled: boolean;
  depositEnabled: boolean;
  withdrawalEnabled: boolean;
  depositMinAmount?: string;
  depositMaxAmount?: string;
  withdrawalMinAmount?: string;
  withdrawalMaxAmount?: string;
  feeFixed?: string;
  feePercent?: string;
}

export interface PaymentRailConfig {
  id: string;
  name: string;
  kind: "bank_transfer" | "card" | "cash" | "crypto" | "other";
  currencies: string[];
  countries: string[];
  enabled: boolean;
  estimatedProcessingMinutesMin: number;
  estimatedProcessingMinutesMax: number;
}

// Known rail identifiers (suggested values). Validators allow any string; list
// below is provided for IDE autocomplete and documentation.
// Suggested: "SEPA" | "ACH" | "WIRE" | "OTHER"
export type RailType = string;

export interface DepositRequestMetadata {
  assetCode: string;
  amount: string;
  account: StellarPublicKey;
  memo?: string;
  memoType?: MemoType;
  railId?: string;
  clientDomain?: string;
  emailAddress?: string;
  type: RailType;
}

export interface WithdrawalRequestMetadata {
  assetCode: string;
  amount: string;
  account: StellarPublicKey;
  memo?: string;
  memoType?: MemoType;
  railId?: string;
  clientDomain?: string;
  dest: string;
  destExtra?: string;
  type: RailType;
}

export interface AnchorTransactionRecord {
  id: string;
  kind: AnchorTransactionKind;
  status: AnchorTransactionStatus;
  assetCode: string;
  amountIn: string;
  amountOut?: string;
  feeAmount?: string;
  stellarAccount: StellarPublicKey;
  stellarTransactionId?: StellarTransactionHash;
  externalTransactionId?: string;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  userActionRequired?: boolean;
  userActionUrl?: string;
  message?: string;
  refunded?: boolean;
  metadata: Record<string, unknown>;
}

export type MilestoneStatus =
  | "draft"
  | "active"
  | "evidence_submitted"
  | "approved"
  | "disputed"
  | "ready_for_release"
  | "released";

export const MILESTONE_STATUSES: readonly MilestoneStatus[] = [
  "draft",
  "active",
  "evidence_submitted",
  "approved",
  "disputed",
  "ready_for_release",
  "released",
] as const;

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  amount: string;
  status: MilestoneStatus;
  evidenceHash?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  releasedAt?: string;
  disputedAt?: string;
  disputeReason?: string;
}

export interface EscrowSummary {
  totalMilestones: number;
  totalAmount: string;
  releasedAmount: string;
  pendingAmount: string;
  disputedCount: number;
  completedCount: number;
  admin: string;
}

export interface EscrowEvent {
  type:
    | "evidence_submitted"
    | "approved"
    | "disputed"
    | "ready_for_release"
    | "released"
    | "milestone_created";
  milestoneId: string;
  timestamp: string;
  caller: string;
  details?: Record<string, unknown>;
}

export type FeatureStability = "stable" | "experimental" | "deprecated";

export type FeatureFlagId =
  | "experimental_soroban"
  | "experimental_vault"
  | "mainnet_access"
  | "advanced_diagnostics"
  | (string & Record<never, never>);

export interface FeatureFlagDefinition {
  id: FeatureFlagId;
  name: string;
  description: string;
  stability: FeatureStability;
  defaultEnabled: boolean;
}

export type ConfigSource = "default" | "env" | "explicit" | "override";

export interface ConfigSourceMetadata {
  source: ConfigSource;
  key: string;
  isSensitive: boolean;
  resolvedValue?: unknown;
  stability?: FeatureStability;
}

// ─── Asset display metadata ──────────────────────────────────────────────────

/**
 * Typed state for asset display resolution.
 *
 * - `"native"` — XLM, universally supported.
 * - `"issued"` — valid issued asset from the registry.
 * - `"unsupported"` — structurally valid but not permitted on the target network.
 * - `"unknown"` — not in the registry or structurally invalid.
 */
export type AssetDisplayState = "native" | "issued" | "unsupported" | "unknown";

export const ASSET_DISPLAY_STATES: readonly AssetDisplayState[] = [
  "native",
  "issued",
  "unsupported",
  "unknown",
] as const;

/**
 * Placeholder icon data for an asset when no image URL is configured.
 * Renders as a coloured circle with the first character of the asset code.
 */
export interface AssetIconPlaceholder {
  /** Single character drawn inside the icon circle. */
  character: string;
  /** Tailwind-compatible background colour class. */
  bgColor: string;
}

/**
 * Configured display metadata for a known asset.
 */
export interface AssetDisplayMetadata {
  /** Human-readable display name (e.g. "Stellar Lumens", "USD Coin"). */
  displayName: string;
  /** Short asset code (e.g. "XLM", "USDC"). */
  code: string;
  /** Asset issuer public key — `null` for native XLM. */
  issuer: string | null;
  /** Icon placeholder for when no image is available. */
  iconPlaceholder: AssetIconPlaceholder;
  /** Which networks this asset is known on (from registry). */
  networks: StellarNetwork[];
  /** Human-readable trust assumption note. */
  trustNote: string;
}

/**
 * Fully resolved asset display info returned by the resolver.
 * Combines the resolved display state with the underlying asset and metadata.
 */
export interface AssetDisplayInfo {
  /** Typed resolution state. */
  state: AssetDisplayState;
  /** The underlying Stellar asset. */
  asset: StellarAsset;
  /** Which network was queried. */
  network: StellarNetwork;
  /** Display metadata — present when state is `"native"` or `"issued"`. */
  metadata: AssetDisplayMetadata | null;
  /** Error message when state is `"unsupported"`. */
  error: string | null;
}

export type StellarErrorCode =
  | "PUBLIC_KEY_INVALID"
  | "SECRET_KEY_INVALID"
  | "ACCOUNT_NOT_FOUND"
  | "ACCOUNT_MALFORMED"
  | "ASSET_INVALID"
  | "ASSET_UNSUPPORTED"
  | "AMOUNT_INVALID"
  | "MEMO_INVALID"
  | "TRANSACTION_HASH_INVALID"
  | "NETWORK_ERROR"
  | "MAINNET_DISABLED"
  | "FEATURE_DISABLED"
  | "UNSUPPORTED_FEATURE"
  | "UNAUTHORIZED"
  | "UNKNOWN";

export interface StellarKitError extends Error {
  code: StellarErrorCode;
  cause?: unknown;
  redacted: true;
}

// ─── Shared severity mapping ────────────────────────────────────────────────

/**
 * Canonical severity levels used across all modules. Every domain status
 * maps to one of these levels so UI components render consistently.
 */
export type SeverityLevel = "info" | "success" | "warning" | "blocked" | "error" | "unknown";

/**
 * Visual badge tone for status indicators. Maps 1:1 to Tailwind color scales.
 * `blocked` maps to `red` like `error` but signals a distinct semantic meaning
 * (user action required vs. system failure).
 */
export type BadgeTone = "neutral" | "amber" | "blue" | "green" | "red";

/**
 * Recommended user action for a given severity level.
 */
export type RecommendedAction =
  | "none"
  | "retry"
  | "contact_support"
  | "check_explorer"
  | "enable_mainnet"
  | "fund_account"
  | "wait"
  | "review_details";

/**
 * Full severity mapping for a domain status. Consumed by badge components,
 * alert components, and documentation generators.
 */
export interface StatusSeverity {
  /** The canonical severity level. */
  level: SeverityLevel;
  /** Display label for badges. */
  label: string;
  /** Visual tone for badge styling. */
  tone: BadgeTone;
  /** User-facing headline. */
  headline: string;
  /** User-facing detail message. */
  detail: string;
  /** Recommended next action, if any. */
  action?: RecommendedAction;
  /** Path to relevant documentation section, if any. */
  docLink?: string;
}

// ─── Escrow events ──────────────────────────────────────────────────────────
export * from "./escrowEvents";

// ─── Shared error taxonomy ──────────────────────────────────────────────────
export * from "./errors";

// ─── Package capability metadata ────────────────────────────────────────────
export * from "./capabilities";

// ─── Capability states ──────────────────────────────────────────────────────
export type CapabilityState =
  | "implemented"
  | "mock"
  | "testnet-only"
  | "experimental"
  | "unavailable";

export const CAPABILITY_STATES: readonly CapabilityState[] = [
  "implemented",
  "mock",
  "testnet-only",
  "experimental",
  "unavailable",
] as const;

export type CapabilityModuleId =
  | "accounts"
  | "payments"
  | "anchors"
  | "escrow"
  | "diagnostics"
  | "network-config";

export interface ModuleCapability {
  id: CapabilityModuleId;
  label: string;
  state: CapabilityState;
  description: string;
  docsHref?: string;
}

export type PackageName =
  | "stellar-kit"
  | "anchor-utils"
  | "config"
  | "types"
  | "validators"
  | "fixtures";

export interface PackageFeatureCapability {
  id: string;
  label: string;
  state: CapabilityState;
  description: string;
}

export interface PackageCapability {
  packageName: PackageName;
  overallState: CapabilityState;
  features: PackageFeatureCapability[];
  docsHref?: string;
}

