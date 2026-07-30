import type { AccountDiagnostic } from "@anchorkit/stellar-kit";
import {
  containsSecret,
  diagnoseAccount,
  diagnoseAccountInfo,
  diagnoseConfig,
  getAccountDiagnosticSeverity,
} from "@anchorkit/stellar-kit";
import { DEFAULT_ENV_CONFIG, getFeatureFlagDefinitions, NETWORK_CONFIGS } from "@anchorkit/config";
import { StatusBadgeExampleSchema } from "@anchorkit/validators";
import {
  diagnosticsFundedAccountInfo,
  diagnosticsUnavailableAccountInfo,
  diagnosticsUnfundedAccountInfo,
} from "./fixtures";

describe("diagnostics public export", () => {
  it.each([
    [diagnosticsFundedAccountInfo, "funded"],
    [diagnosticsUnfundedAccountInfo, "unfunded"],
    [diagnosticsUnavailableAccountInfo, "unavailable"],
  ] as const)("maps a shared account fixture to the %s diagnostic state", (fixture, state) => {
    const diagnostic: AccountDiagnostic = diagnoseAccountInfo(fixture);
    const severity = getAccountDiagnosticSeverity(diagnostic.state);
    const badge = StatusBadgeExampleSchema.parse({
      domain: "diagnostic",
      status: diagnostic.state,
      severity,
    });

    expect(diagnostic.state).toBe(state);
    expect(badge.status).toBe(state);
    expect(badge.severity.label.length).toBeGreaterThan(0);
    expect(badge.severity.level).toBe(severity.level);
  });

  it("exports funded balance, reserve, and explorer metadata", () => {
    const diagnostic = diagnoseAccountInfo(diagnosticsFundedAccountInfo);

    expect(diagnostic.reserve).toMatchObject({
      minimumBalanceXlm: 2.5,
      entryCount: 5,
    });
    expect(diagnostic.balances).toMatchObject({
      state: "known",
      spendable: "97.5000000",
    });
    expect(diagnostic.expertUrl?.startsWith(NETWORK_CONFIGS.testnet.expertBaseUrl)).toBe(true);
  });

  it("exports graceful invalid and unavailable async diagnostics", async () => {
    const invalid = await diagnoseAccount("not-a-stellar-public-key");
    const unavailable = await diagnoseAccount(diagnosticsFundedAccountInfo.publicKey, {
      loadAccount: () => Promise.reject(new Error("fixture network unavailable")),
    });

    expect(invalid).toMatchObject({
      state: "invalid",
      isValidPublicKey: false,
      expertUrl: null,
    });
    expect(unavailable).toMatchObject({
      state: "unavailable",
      isValidPublicKey: true,
      error: "fixture network unavailable",
    });
  });

  it("exports config diagnostics without leaking sensitive values", () => {
    const diagnostic = diagnoseConfig(DEFAULT_ENV_CONFIG);
    const experimental = diagnoseConfig({
      ...DEFAULT_ENV_CONFIG,
      featureFlags: {
        ...DEFAULT_ENV_CONFIG.featureFlags,
        experimental_soroban: true,
      },
    });

    expect(diagnostic.isAllStable).toBe(true);
    expect(diagnostic.featureFlags).toHaveLength(getFeatureFlagDefinitions().length);
    expect(containsSecret(JSON.stringify(diagnostic))).toBe(false);

    const secretSource = diagnostic.configSources.find(
      (source) => source.key === "secretKeyPrefix"
    );
    expect(secretSource).toMatchObject({
      isSensitive: true,
      resolvedValue: "[REDACTED]",
    });

    expect(experimental.isAllStable).toBe(false);
    expect(
      experimental.featureFlags.find((flag) => flag.id === "experimental_soroban")?.enabled
    ).toBe(true);
  });
});
