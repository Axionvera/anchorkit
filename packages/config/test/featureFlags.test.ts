import { describe, expect, it } from "vitest";
import {
  DEFAULT_ENV_CONFIG,
  assertFeatureEnabled,
  getFeatureFlagDefinitions,
  isFeatureEnabled,
  resolveConfigSourceMetadata,
} from "../src";

describe("Feature Flag & Config Source Framework", () => {
  it("provides feature flag definitions with stability and default states", () => {
    const definitions = getFeatureFlagDefinitions();
    expect(definitions.length).toBeGreaterThanOrEqual(4);

    const sorobanDef = definitions.find((d) => d.id === "experimental_soroban");
    expect(sorobanDef).toBeDefined();
    expect(sorobanDef?.stability).toBe("experimental");
    expect(sorobanDef?.defaultEnabled).toBe(false);

    const vaultDef = definitions.find((d) => d.id === "experimental_vault");
    expect(vaultDef).toBeDefined();
    expect(vaultDef?.stability).toBe("experimental");
    expect(vaultDef?.defaultEnabled).toBe(false);
  });

  it("disables experimental features by default", () => {
    expect(isFeatureEnabled("experimental_soroban")).toBe(false);
    expect(isFeatureEnabled("experimental_vault")).toBe(false);
  });

  it("allows enabling experimental features via env config override", () => {
    const customConfig = {
      ...DEFAULT_ENV_CONFIG,
      featureFlags: {
        experimental_soroban: true,
        experimental_vault: false,
      },
    };

    expect(isFeatureEnabled("experimental_soroban", customConfig)).toBe(true);
    expect(isFeatureEnabled("experimental_vault", customConfig)).toBe(false);
  });

  it("throws typed error when asserting a disabled feature", () => {
    expect(() => assertFeatureEnabled("experimental_soroban")).toThrowError(
      /Feature 'Experimental Soroban Support' \(experimental_soroban\) is disabled by default/
    );

    try {
      assertFeatureEnabled("experimental_soroban");
    } catch (err: any) {
      expect(err.code).toBe("FEATURE_DISABLED");
      expect(err.name).toBe("StellarKitError");
      expect(err.redacted).toBe(true);
    }
  });

  it("does not throw when asserting an enabled feature", () => {
    const customConfig = {
      ...DEFAULT_ENV_CONFIG,
      featureFlags: {
        experimental_soroban: true,
      },
    };

    expect(() => assertFeatureEnabled("experimental_soroban", customConfig)).not.toThrow();
  });

  it("resolves config source metadata safely without exposing secrets", () => {
    const metadata = resolveConfigSourceMetadata(DEFAULT_ENV_CONFIG);
    expect(Array.isArray(metadata)).toBe(true);

    const secretKeyMeta = metadata.find((m) => m.key === "secretKeyPrefix");
    expect(secretKeyMeta).toBeDefined();
    expect(secretKeyMeta?.isSensitive).toBe(true);
    expect(secretKeyMeta?.resolvedValue).toBe("[REDACTED]");

    const sorobanMeta = metadata.find((m) => m.key === "featureFlags.experimental_soroban");
    expect(sorobanMeta).toBeDefined();
    expect(sorobanMeta?.isSensitive).toBe(false);
    expect(sorobanMeta?.resolvedValue).toBe(false);
    expect(sorobanMeta?.stability).toBe("experimental");
  });
});
