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
}

export interface TransactionReadiness {
  ready: boolean;
  warnings: ReadinessWarning[];
  summary: string;
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

export type StellarErrorCode =
  | "PUBLIC_KEY_INVALID"
  | "SECRET_KEY_INVALID"
  | "ACCOUNT_NOT_FOUND"
  | "ACCOUNT_MALFORMED"
  | "ASSET_INVALID"
  | "AMOUNT_INVALID"
  | "MEMO_INVALID"
  | "TRANSACTION_HASH_INVALID"
  | "NETWORK_ERROR"
  | "MAINNET_DISABLED"
  | "UNAUTHORIZED"
  | "UNKNOWN";

export interface StellarKitError extends Error {
  code: StellarErrorCode;
  cause?: unknown;
  redacted: true;
}

// ─── Escrow events ──────────────────────────────────────────────────────────
export * from "./escrowEvents";

// ─── Shared error taxonomy ──────────────────────────────────────────────────
export * from "./errors";

