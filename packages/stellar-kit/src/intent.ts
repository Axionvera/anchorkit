import type {
  AccountBalanceModel,
  PaymentIntent,
  ReadinessWarning,
  StellarAsset,
  TransactionReadiness,
} from "@anchorkit/types";
import { STELLAR_NETWORKS } from "@anchorkit/types";
import type { StellarNetwork } from "@anchorkit/types";
import {
  DEFAULT_ENV_CONFIG,
  assertNetworkAllowed,
  getNetworkConfig,
  isMainnetAllowed,
} from "@anchorkit/config";
import type { AnchorKitEnvConfig } from "@anchorkit/config";
import { PaymentIntentSchema } from "@anchorkit/validators";
import type { SafeParseReturnType } from "zod";
import { createStellarError } from "./errors";
import { isPublicKeyValid } from "./keys";
import { isAssetValid, isNativeAsset } from "./assets";
import { compareAmounts, isAmountValid, isMemoValid } from "./payments";
import { getAccountStatus, loadAccount } from "./accounts";
import { computeBalanceModel } from "./balances";

export function createPaymentIntent(input: {
  sourcePublicKey: string;
  destinationPublicKey: string;
  asset: StellarAsset;
  amount: string;
  memo?: { type: "none" | "text" | "id" | "hash" | "return"; value: string };
}): PaymentIntent {
  const result = PaymentIntentSchema.safeParse(input);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    throw createStellarError(
      "AMOUNT_INVALID",
      firstIssue?.message ?? "Invalid payment intent parameters"
    );
  }
  return result.data;
}

export function validatePaymentIntent(
  intent: unknown
): SafeParseReturnType<unknown, PaymentIntent> {
  return PaymentIntentSchema.safeParse(intent);
}

export function isPaymentIntentValid(intent: unknown): boolean {
  return validatePaymentIntent(intent).success;
}

export function estimateTransactionReadinessSync(
  intent: PaymentIntent,
  options: {
    network?: StellarNetwork;
    envConfig?: AnchorKitEnvConfig;
    sourceAccountFunded?: boolean;
    destAccountFunded?: boolean;
    /**
     * Spendable balance model for the source account. Opt-in: when omitted,
     * readiness behaves exactly as before and makes no claim about funds.
     */
    sourceBalances?: AccountBalanceModel;
  } = {}
): TransactionReadiness {
  const warnings: ReadinessWarning[] = [];
  const envConfig = options.envConfig ?? DEFAULT_ENV_CONFIG;
  const network = options.network ?? envConfig.defaultNetwork;

  if (!isPublicKeyValid(intent.sourcePublicKey)) {
    warnings.push({
      code: "SOURCE_INVALID",
      message: "Source public key is invalid",
      severity: "error",
    });
  }

  if (!isPublicKeyValid(intent.destinationPublicKey)) {
    warnings.push({
      code: "DEST_INVALID",
      message: "Destination public key is invalid",
      severity: "error",
    });
  }

  if (
    isPublicKeyValid(intent.sourcePublicKey) &&
    isPublicKeyValid(intent.destinationPublicKey) &&
    intent.sourcePublicKey === intent.destinationPublicKey
  ) {
    warnings.push({
      code: "SAME_SOURCE_DEST",
      message: "Source and destination accounts are the same",
      severity: "warning",
    });
  }

  if (!isAssetValid(intent.asset)) {
    warnings.push({
      code: "ASSET_INVALID",
      message: "Asset configuration is invalid",
      severity: "error",
    });
  }

  if (!isAmountValid(intent.amount)) {
    warnings.push({
      code: "AMOUNT_INVALID",
      message: "Payment amount is invalid or outside allowed range",
      severity: "error",
    });
  }

  if (intent.memo && !isMemoValid(intent.memo)) {
    warnings.push({
      code: "MEMO_INVALID",
      message: "Memo value is invalid for the selected memo type",
      severity: "error",
    });
  }

  if (network === STELLAR_NETWORKS.MAINNET && !isMainnetAllowed(envConfig)) {
    warnings.push({
      code: "MAINNET_DISABLED",
      message:
        "Mainnet mode is disabled by default. Review security notes and explicitly enable mainnet if needed.",
      severity: "error",
    });
  }

  if (options.sourceAccountFunded === false) {
    warnings.push({
      code: "SOURCE_UNFUNDED",
      message: "Source account is not funded on the network",
      severity: "warning",
    });
  }

  if (options.destAccountFunded === false) {
    warnings.push({
      code: "DEST_UNFUNDED",
      message:
        "Destination account is not funded. Issued asset payments require the destination to have a trustline.",
      severity: "warning",
    });
  }

  // Spendable-balance check. Only meaningful for native payments: the XLM
  // minimum balance constrains how much XLM can leave the account, not how
  // much of an issued asset can.
  const sourceBalances = options.sourceBalances;
  if (sourceBalances && isNativeAsset(intent.asset) && isAmountValid(intent.amount)) {
    if (sourceBalances.state === "known" && sourceBalances.spendable !== null) {
      if (compareAmounts(sourceBalances.spendable, intent.amount) < 0) {
        warnings.push({
          code: "INSUFFICIENT_FUNDS",
          message:
            `Spendable balance is ${sourceBalances.spendable} XLM, below the ` +
            `${intent.amount} XLM payment. ${sourceBalances.explanation}`,
          severity: "error",
        });
      }
    } else {
      // Deliberately carries no figure: an unavailable balance must not be
      // presented as a number the user could act on.
      warnings.push({
        code: "SPENDABLE_UNKNOWN",
        message: `Spendable balance could not be determined. ${sourceBalances.explanation}`,
        severity: "info",
      });
    }
  }

  const errorCount = warnings.filter((w) => w.severity === "error").length;
  const ready = errorCount === 0;

  const summary = buildReadinessSummary(ready, warnings);

  return { ready, warnings, summary };
}

export async function estimateTransactionReadiness(
  intent: PaymentIntent,
  options: {
    network?: StellarNetwork;
    envConfig?: AnchorKitEnvConfig;
  } = {}
): Promise<TransactionReadiness> {
  const envConfig = options.envConfig ?? DEFAULT_ENV_CONFIG;
  const network = options.network ?? envConfig.defaultNetwork;
  const networkConfig = getNetworkConfig(network);

  if (network === STELLAR_NETWORKS.MAINNET) {
    assertNetworkAllowed(network, envConfig);
  }

  // The source is loaded in full rather than status-only: `getAccountStatus`
  // fetches the whole account and then discards the balances and subentry
  // count, which are exactly what the spendable model needs. Reading them here
  // costs no extra network call. The destination only needs its status.
  const [sourceInfo, destStatus] = await Promise.allSettled([
    loadAccount(intent.sourcePublicKey, { networkConfig, envConfig }),
    getAccountStatus(intent.destinationPublicKey, { networkConfig, envConfig }),
  ]);

  const sourceFunded =
    sourceInfo.status === "fulfilled" ? sourceInfo.value.status === "funded" : undefined;
  const sourceBalances =
    sourceInfo.status === "fulfilled" ? computeBalanceModel(sourceInfo.value) : undefined;
  const destFunded =
    destStatus.status === "fulfilled" ? destStatus.value === "funded" : undefined;

  return estimateTransactionReadinessSync(intent, {
    network,
    envConfig,
    sourceAccountFunded: sourceFunded,
    destAccountFunded: destFunded,
    sourceBalances,
  });
}

function buildReadinessSummary(ready: boolean, warnings: ReadinessWarning[]): string {
  if (ready && warnings.length === 0) {
    return "Payment intent is fully ready. Review warnings above for optional checks.";
  }
  if (ready && warnings.length > 0) {
    return `Payment intent is ready with ${warnings.length} warning(s). Resolve warnings before signing.`;
  }
  const errors = warnings.filter((w) => w.severity === "error").length;
  return `Payment intent has ${errors} blocker(s) and ${warnings.length - errors} warning(s). Fix blockers before building the transaction.`;
}
