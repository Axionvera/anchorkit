import type {
  PaymentIntent,
  ReadinessWarning,
  StellarAsset,
  StellarPublicKey,
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
import { isAssetValid } from "./assets";
import { isAmountValid, isMemoValid } from "./payments";
import { getAccountStatus } from "./accounts";

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

import {
  evaluateTransactionReadinessSync,
  evaluateTransactionReadiness,
} from "./readiness";

export function estimateTransactionReadinessSync(
  intent: PaymentIntent,
  options: {
    network?: StellarNetwork;
    envConfig?: AnchorKitEnvConfig;
    sourceAccountFunded?: boolean;
    destAccountFunded?: boolean;
  } = {}
): TransactionReadiness {
  return evaluateTransactionReadinessSync(intent, options);
}

export async function estimateTransactionReadiness(
  intent: PaymentIntent,
  options: {
    network?: StellarNetwork;
    envConfig?: AnchorKitEnvConfig;
  } = {}
): Promise<TransactionReadiness> {
  return evaluateTransactionReadiness(intent, options);
}

