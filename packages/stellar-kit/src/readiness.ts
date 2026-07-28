/**
 * Unified Transaction Readiness Pipeline.
 *
 * Coordinates network safety, account diagnostics, asset validation, amount bounds,
 * reserve requirements, memo rules, and UI readiness states across AnchorKit.
 */

import type {
  AccountInfo,
  PaymentIntent,
  ReadinessIssue,
  ReadinessStageId,
  ReadinessStageResult,
  ReadinessWarning,
  StellarNetwork,
  TransactionReadinessState,
} from "@anchorkit/types";
import { STELLAR_NETWORKS } from "@anchorkit/types";
import type { AnchorKitEnvConfig } from "@anchorkit/config";
import { DEFAULT_ENV_CONFIG, isMainnetAllowed } from "@anchorkit/config";
import { isPublicKeyValid } from "./keys";
import { isAssetValid } from "./assets";
import { isAmountValid, isMemoValid } from "./payments";
import type { AccountDiagnostic } from "./diagnostics";
import { diagnoseAccount } from "./diagnostics";

export interface ReadinessOptionsSync {
  network?: StellarNetwork;
  envConfig?: AnchorKitEnvConfig;
  sourceDiagnostic?: AccountDiagnostic;
  destDiagnostic?: AccountDiagnostic;
  sourceAccountFunded?: boolean;
  destAccountFunded?: boolean;
  sourceBalanceXlm?: string;
}

export interface ReadinessOptionsAsync {
  network?: StellarNetwork;
  envConfig?: AnchorKitEnvConfig;
  loadAccount?: (pk: string) => Promise<AccountInfo>;
}

/** Result shape for the five-stage diagnostics-oriented readiness pipeline. */
export interface TransactionReadinessPipeline {
  state: TransactionReadinessState;
  ready: boolean;
  stages: Record<ReadinessStageId, ReadinessStageResult>;
  issues: ReadinessIssue[];
  warnings: ReadinessWarning[];
  summary: string;
  sourceDiagnostic?: AccountDiagnostic;
  destDiagnostic?: AccountDiagnostic;
}

export function evaluateTransactionReadinessSync(
  intent: PaymentIntent,
  options: ReadinessOptionsSync = {}
): TransactionReadinessPipeline {
  const envConfig = options.envConfig ?? DEFAULT_ENV_CONFIG;
  const network = options.network ?? envConfig.defaultNetwork;
  const issues: ReadinessIssue[] = [];

  // Stage 1: Network Check
  let networkState: TransactionReadinessState = "valid";
  let networkMsg = "Network configuration is valid and active.";
  if (network === STELLAR_NETWORKS.MAINNET && !isMainnetAllowed(envConfig)) {
    networkState = "blocked";
    networkMsg = "Mainnet access is disabled by default for safety.";
    issues.push({
      code: "MAINNET_DISABLED",
      stage: "network",
      severity: "error",
      message:
        "Mainnet mode is disabled by default. Review security notes and explicitly enable mainnet if needed.",
    });
  }

  // Stage 2: Account Diagnostics
  let accountState: TransactionReadinessState = "valid";
  let accountMsg = "Source and destination accounts are valid.";
  const sourceValid = isPublicKeyValid(intent.sourcePublicKey);
  const destValid = isPublicKeyValid(intent.destinationPublicKey);

  if (!sourceValid) {
    accountState = "invalid";
    issues.push({
      code: "SOURCE_INVALID",
      stage: "account",
      severity: "error",
      message: "Source public key is invalid.",
      field: "sourcePublicKey",
    });
  }

  if (!destValid) {
    accountState = "invalid";
    issues.push({
      code: "DEST_INVALID",
      stage: "account",
      severity: "error",
      message: "Destination public key is invalid.",
      field: "destinationPublicKey",
    });
  }

  if (sourceValid && destValid && intent.sourcePublicKey === intent.destinationPublicKey) {
    if (accountState === "valid") accountState = "warning";
    issues.push({
      code: "SAME_SOURCE_DEST",
      stage: "account",
      severity: "warning",
      message: "Source and destination accounts are the same.",
    });
  }

  // Source funding & reserve checks
  const sourceDiag = options.sourceDiagnostic;
  const destDiag = options.destDiagnostic;

  const sourceFunded = sourceDiag ? sourceDiag.state === "funded" : options.sourceAccountFunded;
  const destFunded = destDiag ? destDiag.state === "funded" : options.destAccountFunded;

  if (sourceDiag && sourceDiag.state === "unavailable") {
    accountState = "unavailable";
    accountMsg = "Source account diagnostic is unavailable.";
    issues.push({
      code: "SOURCE_UNAVAILABLE",
      stage: "account",
      severity: "error",
      message: "Source account diagnostics unavailable.",
    });
  } else if (sourceFunded === false) {
    if (accountState !== "invalid") accountState = "blocked";
    accountMsg = "Source account is not funded on the network.";
    issues.push({
      code: "SOURCE_UNFUNDED",
      stage: "account",
      severity: "error",
      message: "Source account is not funded on the network.",
    });
  }

  if (destDiag && destDiag.state === "unavailable") {
    if (accountState === "valid") accountState = "warning";
    issues.push({
      code: "DEST_UNAVAILABLE",
      stage: "account",
      severity: "warning",
      message: "Destination account diagnostic is unavailable.",
    });
  } else if (destFunded === false) {
    if (intent.asset.type === "issued") {
      if (accountState !== "invalid") accountState = "blocked";
      issues.push({
        code: "DEST_UNFUNDED_TRUSTLINE",
        stage: "account",
        severity: "error",
        message:
          "Destination account is unfunded. Issued asset payments require an active trustline.",
      });
    } else {
      if (accountState === "valid") accountState = "warning";
      issues.push({
        code: "DEST_UNFUNDED",
        stage: "account",
        severity: "warning",
        message: "Destination account is unfunded. Payment will create and fund the account.",
      });
    }
  }

  // Check reserve & balance requirement if source balance is available
  const sourceNativeBal = options.sourceBalanceXlm ?? sourceDiag?.account?.balances?.native;
  if (
    sourceNativeBal !== undefined &&
    intent.asset.type === "native" &&
    isAmountValid(intent.amount)
  ) {
    const numBal = Number(sourceNativeBal);
    const numAmt = Number(intent.amount);
    const minReserve = sourceDiag?.reserve?.minimumBalanceXlm ?? 2.5;
    if (numBal < numAmt + minReserve) {
      if (accountState !== "invalid") accountState = "blocked";
      issues.push({
        code: "INSUFFICIENT_BALANCE",
        stage: "account",
        severity: "error",
        message: `Source balance (${numBal} XLM) is insufficient for payment amount (${numAmt} XLM) plus reserve requirement (${minReserve} XLM).`,
      });
    }
  }

  // Stage 3: Asset Check
  let assetState: TransactionReadinessState = "valid";
  let assetMsg = "Asset configuration is valid.";
  if (!isAssetValid(intent.asset)) {
    assetState = "invalid";
    assetMsg = "Asset configuration is invalid.";
    issues.push({
      code: "ASSET_INVALID",
      stage: "asset",
      severity: "error",
      message: "Asset configuration is invalid.",
      field: "asset",
    });
  } else if (intent.asset.type === "issued") {
    if (!isPublicKeyValid(intent.asset.issuer)) {
      assetState = "invalid";
      issues.push({
        code: "ASSET_ISSUER_INVALID",
        stage: "asset",
        severity: "error",
        message: "Asset issuer public key is invalid.",
        field: "asset.issuer",
      });
    } else if (destDiag?.account?.balances?.assets) {
      const code = intent.asset.code;
      const issuer = intent.asset.issuer;
      const hasTrust = destDiag.account.balances.assets.some(
        (a: { code: string; issuer: string }) => a.code === code && a.issuer === issuer
      );
      if (!hasTrust) {
        assetState = "blocked";
        assetMsg = `Destination account missing trustline for ${code}:${issuer}.`;
        issues.push({
          code: "MISSING_TRUSTLINE",
          stage: "asset",
          severity: "error",
          message: `Destination account does not have a trustline for ${code}:${issuer}.`,
        });
      }
    }
  }

  // Stage 4: Amount Check
  let amountState: TransactionReadinessState = "valid";
  let amountMsg = "Payment amount is valid.";
  if (!isAmountValid(intent.amount)) {
    amountState = "invalid";
    amountMsg = "Payment amount is invalid or outside allowed range.";
    issues.push({
      code: "AMOUNT_INVALID",
      stage: "amount",
      severity: "error",
      message: "Payment amount is invalid or outside allowed range.",
      field: "amount",
    });
  }

  // Stage 5: Memo Check
  let memoState: TransactionReadinessState = "valid";
  let memoMsg = intent.memo ? "Memo configuration is valid." : "No memo specified.";
  if (intent.memo && !isMemoValid(intent.memo)) {
    memoState = "invalid";
    memoMsg = "Memo value is invalid for the selected memo type.";
    issues.push({
      code: "MEMO_INVALID",
      stage: "memo",
      severity: "error",
      message: "Memo value is invalid for the selected memo type.",
      field: "memo",
    });
  }

  const stages: Record<ReadinessStageId, ReadinessStageResult> = {
    network: { stage: "network", state: networkState, message: networkMsg },
    account: { stage: "account", state: accountState, message: accountMsg },
    asset: { stage: "asset", state: assetState, message: assetMsg },
    amount: { stage: "amount", state: amountState, message: amountMsg },
    memo: { stage: "memo", state: memoState, message: memoMsg },
  };

  const overallState = deriveOverallState(stages);
  const ready = overallState === "valid" || overallState === "warning";

  const warnings: ReadinessWarning[] = issues.map((i) => ({
    code: i.code,
    message: i.message,
    severity: i.severity,
    stage: i.stage,
  }));

  const summary = buildSummary(overallState, issues);

  return {
    state: overallState,
    ready,
    stages,
    issues,
    warnings,
    summary,
    sourceDiagnostic: sourceDiag,
    destDiagnostic: destDiag,
  };
}

export async function evaluateTransactionReadiness(
  intent: PaymentIntent,
  options: ReadinessOptionsAsync = {}
): Promise<TransactionReadinessPipeline> {
  const envConfig = options.envConfig ?? DEFAULT_ENV_CONFIG;
  const network = options.network ?? envConfig.defaultNetwork;

  const [sourceDiagnostic, destDiagnostic] = await Promise.all([
    diagnoseAccount(intent.sourcePublicKey, { network, loadAccount: options.loadAccount }),
    diagnoseAccount(intent.destinationPublicKey, { network, loadAccount: options.loadAccount }),
  ]);

  return evaluateTransactionReadinessSync(intent, {
    network,
    envConfig,
    sourceDiagnostic,
    destDiagnostic,
  });
}

function deriveOverallState(
  stages: Record<ReadinessStageId, ReadinessStageResult>
): TransactionReadinessState {
  const stageValues = Object.values(stages).map((s) => s.state);
  if (stageValues.includes("invalid")) return "invalid";
  if (stageValues.includes("blocked")) return "blocked";
  if (stageValues.includes("unavailable")) return "unavailable";
  if (stageValues.includes("warning")) return "warning";
  return "valid";
}

function buildSummary(state: TransactionReadinessState, issues: ReadinessIssue[]): string {
  const errors = issues.filter((i) => i.severity === "error").length;
  const warnings = issues.filter((i) => i.severity === "warning").length;

  switch (state) {
    case "valid":
      return "Transaction readiness: VALID. All 5 validation stages passed cleanly.";
    case "warning":
      return `Transaction readiness: WARNING. Intent is ready to proceed, with ${warnings} non-blocking warning(s).`;
    case "blocked":
      return `Transaction readiness: BLOCKED. Fix ${errors} blocker(s) before proceeding.`;
    case "invalid":
      return `Transaction readiness: INVALID. ${errors} field or structure error(s) must be resolved.`;
    case "unavailable":
      return `Transaction readiness: UNAVAILABLE. Network diagnostics could not determine account status.`;
  }
}
