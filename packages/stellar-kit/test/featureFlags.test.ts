import { describe, expect, it } from "vitest";
import { DEFAULT_ENV_CONFIG } from "@anchorkit/config";
import {
  createFeatureDisabledError,
  createVaultSession,
  diagnoseConfig,
  diagnoseSorobanCapability,
  diagnoseVaultCapability,
  executeSorobanCapability,
} from "../src";

describe("StellarKit Feature Flag & Diagnostics Integration", () => {
  it("creates typed feature disabled error", () => {
    const error = createFeatureDisabledError(
      "experimental_soroban",
      "Experimental Soroban Support",
      "experimental"
    );
    expect(error.code).toBe("FEATURE_DISABLED");
    expect(error.name).toBe("StellarKitError");
    expect(error.redacted).toBe(true);
    expect(error.message).toContain("Experimental Soroban Support");
    expect(error.message).toContain("experimental_soroban");
  });

  it("diagnoses configuration safely including non-sensitive metadata and feature flags", () => {
    const diag = diagnoseConfig(DEFAULT_ENV_CONFIG);
    expect(diag.configSources.length).toBeGreaterThan(0);
    expect(diag.featureFlags.length).toBeGreaterThan(0);
    expect(diag.isAllStable).toBe(true);

    const secretKeyMeta = diag.configSources.find((c) => c.key === "secretKeyPrefix");
    expect(secretKeyMeta?.isSensitive).toBe(true);
    expect(secretKeyMeta?.resolvedValue).toBe("[REDACTED]");
  });

  it("detects non-stable features when experimental flag is enabled in diagnostics", () => {
    const customConfig = {
      ...DEFAULT_ENV_CONFIG,
      featureFlags: {
        experimental_soroban: true,
      },
    };
    const diag = diagnoseConfig(customConfig);
    expect(diag.isAllStable).toBe(false);
  });

  describe("Experimental Soroban Capabilities", () => {
    it("throws typed FEATURE_DISABLED error by default", () => {
      expect(() => executeSorobanCapability("deploy_contract")).toThrowError();
      try {
        executeSorobanCapability("deploy_contract");
      } catch (err: any) {
        expect(err.code).toBe("FEATURE_DISABLED");
      }
    });

    it("executes successfully when experimental_soroban is enabled", () => {
      const customConfig = {
        ...DEFAULT_ENV_CONFIG,
        featureFlags: {
          experimental_soroban: true,
        },
      };

      const result = executeSorobanCapability("deploy_contract", { env: customConfig });
      expect(result.status).toBe("executed");
      expect(result.capability).toBe("deploy_contract");
    });

    it("diagnoses soroban capability status", () => {
      expect(diagnoseSorobanCapability().enabled).toBe(false);
      const customConfig = {
        ...DEFAULT_ENV_CONFIG,
        featureFlags: {
          experimental_soroban: true,
        },
      };
      expect(diagnoseSorobanCapability({ env: customConfig }).enabled).toBe(true);
    });
  });

  describe("Experimental Vault Capabilities", () => {
    it("throws typed FEATURE_DISABLED error by default", () => {
      expect(() => createVaultSession("vault_123")).toThrowError();
      try {
        createVaultSession("vault_123");
      } catch (err: any) {
        expect(err.code).toBe("FEATURE_DISABLED");
      }
    });

    it("executes successfully when experimental_vault is enabled", () => {
      const customConfig = {
        ...DEFAULT_ENV_CONFIG,
        featureFlags: {
          experimental_vault: true,
        },
      };

      const result = createVaultSession("vault_123", { env: customConfig });
      expect(result.status).toBe("active");
      expect(result.vaultId).toBe("vault_123");
    });

    it("diagnoses vault capability status", () => {
      expect(diagnoseVaultCapability().enabled).toBe(false);
      const customConfig = {
        ...DEFAULT_ENV_CONFIG,
        featureFlags: {
          experimental_vault: true,
        },
      };
      expect(diagnoseVaultCapability({ env: customConfig }).enabled).toBe(true);
    });
  });
});
