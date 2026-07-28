import { describe, it, expect, vi, beforeEach } from "vitest";
import { Keypair } from "@stellar/stellar-base";
import { estimateTransactionReadinessSync, estimateTransactionReadiness } from "../src/intent";
import { loadAccount, getAccountStatus } from "../src/accounts";
import { diagnoseAccount } from "../src/diagnostics";
import type { PaymentIntent } from "@anchorkit/types";
import { DEFAULT_ENV_CONFIG, NETWORK_CONFIGS } from "@anchorkit/config";

const mockHorizonLoadAccount = vi.fn();

vi.mock("@stellar/stellar-sdk", async () => {
  const actual = await vi.importActual<typeof import("@stellar/stellar-sdk")>(
    "@stellar/stellar-sdk"
  );
  return {
    ...actual,
    Horizon: {
      ...actual.Horizon,
      Server: vi.fn().mockImplementation(() => ({
        loadAccount: mockHorizonLoadAccount,
      })),
    },
  };
});

const FAKE_HORIZON_ACCOUNT = {
  sequence: "123456789",
  subentry_count: 1,
  last_modified_ledger: 42,
  balances: [{ asset_type: "native", balance: "100.0000000" }],
};

const VALID_INTENT: PaymentIntent = {
  sourcePublicKey: "GA2C5RFPE6GCKMY3K7AIGZ5ZBBX26Z5B3E6G7V4MMSZ5L2R5YHMBFQJJ",
  destinationPublicKey: "GBMFNDXCRSOD7Y7FW5WJ6TZ6MMHCYQJK76Y5QM5T2DJG7QX4LM4LMFTO",
  asset: { type: "native", code: "XLM", issuer: null },
  amount: "10.0000000",
};

describe("Mainnet-risk prevention — payment readiness (sync)", () => {
  it("produces no MAINNET_DISABLED warning for testnet by default", () => {
    const result = estimateTransactionReadinessSync(VALID_INTENT);
    const mainnetWarnings = result.warnings.filter((w) => w.code === "MAINNET_DISABLED");
    expect(mainnetWarnings).toHaveLength(0);
  });

  it("produces no MAINNET_DISABLED warning for testnet explicitly", () => {
    const result = estimateTransactionReadinessSync(VALID_INTENT, {
      network: "testnet",
    });
    const mainnetWarnings = result.warnings.filter((w) => w.code === "MAINNET_DISABLED");
    expect(mainnetWarnings).toHaveLength(0);
  });

  it("produces no MAINNET_DISABLED warning for futurenet", () => {
    const result = estimateTransactionReadinessSync(VALID_INTENT, {
      network: "futurenet",
    });
    const mainnetWarnings = result.warnings.filter((w) => w.code === "MAINNET_DISABLED");
    expect(mainnetWarnings).toHaveLength(0);
  });

  it("produces MAINNET_DISABLED error warning for mainnet with default config", () => {
    const result = estimateTransactionReadinessSync(VALID_INTENT, {
      network: "mainnet",
    });
    const mainnetWarnings = result.warnings.filter((w) => w.code === "MAINNET_DISABLED");
    expect(mainnetWarnings).toHaveLength(1);
    expect(mainnetWarnings[0]!.severity).toBe("error");
    expect(mainnetWarnings[0]!.message).toContain("Mainnet mode is disabled by default");
  });

  it("mainnet warning makes readiness false", () => {
    const result = estimateTransactionReadinessSync(VALID_INTENT, {
      network: "mainnet",
    });
    expect(result.ready).toBe(false);
  });

  it("produces no MAINNET_DISABLED warning for mainnet when allowMainnet is true", () => {
    const result = estimateTransactionReadinessSync(VALID_INTENT, {
      network: "mainnet",
      envConfig: { ...DEFAULT_ENV_CONFIG, allowMainnet: true },
    });
    const mainnetWarnings = result.warnings.filter((w) => w.code === "MAINNET_DISABLED");
    expect(mainnetWarnings).toHaveLength(0);
  });

  it("defaults to env config defaultNetwork when no network specified", () => {
    const envConfig = { ...DEFAULT_ENV_CONFIG, defaultNetwork: "testnet" as const };
    const result = estimateTransactionReadinessSync(VALID_INTENT, { envConfig });
    const mainnetWarnings = result.warnings.filter((w) => w.code === "MAINNET_DISABLED");
    expect(mainnetWarnings).toHaveLength(0);
  });
});

describe("Mainnet-risk prevention — estimateTransactionReadiness (async)", () => {
  beforeEach(() => {
    mockHorizonLoadAccount.mockReset();
    mockHorizonLoadAccount.mockResolvedValue(FAKE_HORIZON_ACCOUNT);
  });

  it("rejects with MAINNET_DISABLED for mainnet under default env", async () => {
    await expect(
      estimateTransactionReadiness(VALID_INTENT, { network: "mainnet" })
    ).rejects.toThrow("Mainnet access is disabled");
  });

  it("does not hit Horizon before rejecting for mainnet under default env", async () => {
    await expect(
      estimateTransactionReadiness(VALID_INTENT, { network: "mainnet" })
    ).rejects.toThrow();
    expect(mockHorizonLoadAccount).not.toHaveBeenCalled();
  });

  it("resolves for testnet under default env (mocked Horizon)", async () => {
    const result = await estimateTransactionReadiness(VALID_INTENT, { network: "testnet" });
    expect(result.ready).toBe(true);
  });

  it("resolves for mainnet when allowMainnet is explicitly true", async () => {
    const result = await estimateTransactionReadiness(VALID_INTENT, {
      network: "mainnet",
      envConfig: { ...DEFAULT_ENV_CONFIG, allowMainnet: true },
    });
    const mainnetWarnings = result.warnings.filter((w) => w.code === "MAINNET_DISABLED");
    expect(mainnetWarnings).toHaveLength(0);
  });
});

describe("Mainnet-risk prevention — loadAccount / getAccountStatus", () => {
  const publicKey = Keypair.random().publicKey();

  beforeEach(() => {
    mockHorizonLoadAccount.mockReset();
    mockHorizonLoadAccount.mockResolvedValue(FAKE_HORIZON_ACCOUNT);
  });

  it("rejects loadAccount for a mainnet NetworkConfig under default env", async () => {
    await expect(
      loadAccount(publicKey, { networkConfig: NETWORK_CONFIGS.mainnet })
    ).rejects.toThrow("Mainnet access is disabled");
  });

  it("never reaches Horizon when mainnet is disabled", async () => {
    await expect(
      loadAccount(publicKey, { networkConfig: NETWORK_CONFIGS.mainnet })
    ).rejects.toThrow();
    expect(mockHorizonLoadAccount).not.toHaveBeenCalled();
  });

  it("rejects getAccountStatus for a mainnet NetworkConfig under default env", async () => {
    await expect(
      getAccountStatus(publicKey, { networkConfig: NETWORK_CONFIGS.mainnet })
    ).rejects.toThrow("Mainnet access is disabled");
  });

  it("allows loadAccount for mainnet when allowMainnet is explicitly true", async () => {
    const info = await loadAccount(publicKey, {
      networkConfig: NETWORK_CONFIGS.mainnet,
      envConfig: { ...DEFAULT_ENV_CONFIG, allowMainnet: true },
    });
    expect(info.status).toBe("funded");
    expect(mockHorizonLoadAccount).toHaveBeenCalledTimes(1);
  });

  it("still loads accounts for testnet under default env (mocked Horizon)", async () => {
    const info = await loadAccount(publicKey, { networkConfig: NETWORK_CONFIGS.testnet });
    expect(info.status).toBe("funded");
    expect(info.balances?.native).toBe("100.0000000");
  });

  it("still loads accounts for futurenet under default env (mocked Horizon)", async () => {
    const info = await loadAccount(publicKey, { networkConfig: NETWORK_CONFIGS.futurenet });
    expect(info.status).toBe("funded");
  });
});

describe("Mainnet-risk prevention — diagnoseAccount", () => {
  const publicKey = Keypair.random().publicKey();

  beforeEach(() => {
    mockHorizonLoadAccount.mockReset();
    mockHorizonLoadAccount.mockResolvedValue(FAKE_HORIZON_ACCOUNT);
  });

  it("surfaces a mainnet-disabled error instead of hitting Horizon (no injected loader, default env)", async () => {
    const diag = await diagnoseAccount(publicKey, { network: "mainnet" });
    expect(diag.state).toBe("unavailable");
    expect(diag.error).toContain("Mainnet access is disabled");
    expect(mockHorizonLoadAccount).not.toHaveBeenCalled();
  });

  it("still diagnoses testnet accounts under default env (mocked Horizon)", async () => {
    const diag = await diagnoseAccount(publicKey, { network: "testnet" });
    expect(diag.state).toBe("funded");
  });
});
