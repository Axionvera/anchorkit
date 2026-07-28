/**
 * Experimental Soroban SDK capabilities.
 * Protected by the `experimental_soroban` feature flag framework.
 */
import type { AnchorKitEnvConfig } from "@anchorkit/config";
import { assertFeatureEnabled, DEFAULT_ENV_CONFIG, isFeatureEnabled } from "@anchorkit/config";

export interface ExperimentalSorobanResult {
  capability: string;
  enabled: boolean;
  timestamp: string;
  status: "executed" | "disabled";
}

export function executeSorobanCapability(
  capabilityName: string,
  options?: { env?: AnchorKitEnvConfig }
): ExperimentalSorobanResult {
  const env = options?.env ?? DEFAULT_ENV_CONFIG;
  assertFeatureEnabled("experimental_soroban", env);

  return {
    capability: capabilityName,
    enabled: true,
    timestamp: new Date().toISOString(),
    status: "executed",
  };
}

export function diagnoseSorobanCapability(options?: { env?: AnchorKitEnvConfig }): {
  enabled: boolean;
  stability: "experimental";
} {
  const env = options?.env ?? DEFAULT_ENV_CONFIG;
  return {
    enabled: isFeatureEnabled("experimental_soroban", env),
    stability: "experimental",
  };
}
