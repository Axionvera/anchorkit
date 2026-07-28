/**
 * Experimental Vault SDK capabilities.
 * Protected by the `experimental_vault` feature flag framework.
 */
import type { AnchorKitEnvConfig } from "@anchorkit/config";
import { assertFeatureEnabled, DEFAULT_ENV_CONFIG, isFeatureEnabled } from "@anchorkit/config";

export interface VaultSessionResult {
  vaultId: string;
  enabled: boolean;
  timestamp: string;
  status: "active" | "disabled";
}

export function createVaultSession(
  vaultId: string,
  options?: { env?: AnchorKitEnvConfig }
): VaultSessionResult {
  const env = options?.env ?? DEFAULT_ENV_CONFIG;
  assertFeatureEnabled("experimental_vault", env);

  return {
    vaultId,
    enabled: true,
    timestamp: new Date().toISOString(),
    status: "active",
  };
}

export function diagnoseVaultCapability(options?: { env?: AnchorKitEnvConfig }): {
  enabled: boolean;
  stability: "experimental";
} {
  const env = options?.env ?? DEFAULT_ENV_CONFIG;
  return {
    enabled: isFeatureEnabled("experimental_vault", env),
    stability: "experimental",
  };
}
