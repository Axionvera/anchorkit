import type { NetworkConfig, StellarPublicKey, StellarTransactionHash } from "@anchorkit/types";
import { StellarTransactionHashSchema } from "@anchorkit/validators";
import type { SafeParseReturnType } from "zod";
import { DEFAULT_NETWORK, getNetworkConfig } from "@anchorkit/config";
import type { StellarNetwork } from "@anchorkit/types";
import { isPublicKeyValid } from "./keys";
import { createStellarError } from "./errors";

export function validateTransactionHash(
  hash: string
): SafeParseReturnType<string, StellarTransactionHash> {
  return StellarTransactionHashSchema.safeParse(hash);
}

export function isTransactionHashValid(hash: string): boolean {
  return validateTransactionHash(hash).success;
}

export function assertTransactionHashValid(hash: string): asserts hash is StellarTransactionHash {
  const result = validateTransactionHash(hash);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    throw createStellarError(
      "TRANSACTION_HASH_INVALID",
      firstIssue?.message ?? "Invalid Stellar transaction hash"
    );
  }
}

export function normalizeTransactionHash(hash: string): string {
  return hash.trim().toLowerCase();
}

export function getStellarExpertAccountUrl(
  publicKey: string,
  networkOrConfig: StellarNetwork | NetworkConfig = DEFAULT_NETWORK
): string | null {
  if (!isPublicKeyValid(publicKey)) {
    return null;
  }
  const config =
    typeof networkOrConfig === "string" ? getNetworkConfig(networkOrConfig) : networkOrConfig;
  return `${config.expertBaseUrl}/account/${encodeURIComponent(publicKey)}`;
}

export function getStellarExpertTransactionUrl(
  hash: string,
  networkOrConfig: StellarNetwork | NetworkConfig = DEFAULT_NETWORK
): string | null {
  if (!isTransactionHashValid(hash)) {
    return null;
  }
  const config =
    typeof networkOrConfig === "string" ? getNetworkConfig(networkOrConfig) : networkOrConfig;
  return `${config.expertBaseUrl}/tx/${encodeURIComponent(hash.toLowerCase())}`;
}

export function getStellarExpertAssetUrl(
  code: string,
  issuer: string,
  networkOrConfig: StellarNetwork | NetworkConfig = DEFAULT_NETWORK
): string | null {
  if (!isPublicKeyValid(issuer) || !code || code.length > 12) {
    return null;
  }
  const config =
    typeof networkOrConfig === "string" ? getNetworkConfig(networkOrConfig) : networkOrConfig;
  return `${config.expertBaseUrl}/asset/${encodeURIComponent(code)}/${encodeURIComponent(issuer)}`;
}

export function getHorizonAccountUrl(
  publicKey: string,
  network: StellarNetwork = DEFAULT_NETWORK
): string | null {
  if (!isPublicKeyValid(publicKey)) {
    return null;
  }
  const config = getNetworkConfig(network);
  return `${config.horizonUrl}/accounts/${encodeURIComponent(publicKey)}`;
}

export function getHorizonTransactionUrl(
  hash: string,
  network: StellarNetwork = DEFAULT_NETWORK
): string | null {
  if (!isTransactionHashValid(hash)) {
    return null;
  }
  const config = getNetworkConfig(network);
  return `${config.horizonUrl}/transactions/${encodeURIComponent(hash.toLowerCase())}`;
}

export type { StellarPublicKey, StellarTransactionHash };
