import { describe, it, expect } from "vitest";
import {
  NETWORK_CONFIGS,
  DEFAULT_NETWORK,
  DEFAULT_ENV_CONFIG,
  getNetworkConfig,
  getDefaultNetworkConfig,
  isMainnetAllowed,
  assertNetworkAllowed,
} from "../src/index";

describe("Mainnet-risk prevention — config defaults", () => {
  it("DEFAULT_NETWORK is testnet", () => {
    expect(DEFAULT_NETWORK).toBe("testnet");
  });

  it("DEFAULT_ENV_CONFIG.allowMainnet is false", () => {
    expect(DEFAULT_ENV_CONFIG.allowMainnet).toBe(false);
  });

  it("DEFAULT_ENV_CONFIG.defaultNetwork is testnet", () => {
    expect(DEFAULT_ENV_CONFIG.defaultNetwork).toBe("testnet");
  });

  it("testnet config has isMainnet: false", () => {
    expect(NETWORK_CONFIGS.testnet.isMainnet).toBe(false);
  });

  it("mainnet config has isMainnet: true", () => {
    expect(NETWORK_CONFIGS.mainnet.isMainnet).toBe(true);
  });

  it("futurenet config has isMainnet: false", () => {
    expect(NETWORK_CONFIGS.futurenet.isMainnet).toBe(false);
  });
});

describe("Mainnet-risk prevention — getNetworkConfig", () => {
  it("returns testnet config by default", () => {
    const config = getNetworkConfig();
    expect(config.network).toBe("testnet");
    expect(config.isMainnet).toBe(false);
    expect(config.horizonUrl).toContain("testnet");
  });

  it("returns testnet config when explicitly requested", () => {
    const config = getNetworkConfig("testnet");
    expect(config.network).toBe("testnet");
    expect(config.isMainnet).toBe(false);
  });

  it("returns mainnet config when explicitly requested", () => {
    const config = getNetworkConfig("mainnet");
    expect(config.network).toBe("mainnet");
    expect(config.isMainnet).toBe(true);
  });

  it("returns futurenet config when explicitly requested", () => {
    const config = getNetworkConfig("futurenet");
    expect(config.network).toBe("futurenet");
    expect(config.isMainnet).toBe(false);
  });
});

describe("Mainnet-risk prevention — getDefaultNetworkConfig", () => {
  it("returns testnet config", () => {
    const config = getDefaultNetworkConfig();
    expect(config.network).toBe("testnet");
    expect(config.isMainnet).toBe(false);
  });
});

describe("Mainnet-risk prevention — isMainnetAllowed", () => {
  it("returns false with default env config", () => {
    expect(isMainnetAllowed()).toBe(false);
  });

  it("returns false when allowMainnet is explicitly false", () => {
    expect(isMainnetAllowed({ ...DEFAULT_ENV_CONFIG, allowMainnet: false })).toBe(false);
  });

  it("returns true only when allowMainnet is explicitly true", () => {
    expect(isMainnetAllowed({ ...DEFAULT_ENV_CONFIG, allowMainnet: true })).toBe(true);
  });
});

describe("Mainnet-risk prevention — assertNetworkAllowed", () => {
  it("does not throw for testnet with default config", () => {
    expect(() => assertNetworkAllowed("testnet")).not.toThrow();
  });

  it("does not throw for futurenet with default config", () => {
    expect(() => assertNetworkAllowed("futurenet")).not.toThrow();
  });

  it("throws for mainnet with default config", () => {
    expect(() => assertNetworkAllowed("mainnet")).toThrow("Mainnet access is disabled by default");
  });

  it("throws for mainnet when allowMainnet is false", () => {
    const env = { ...DEFAULT_ENV_CONFIG, allowMainnet: false };
    expect(() => assertNetworkAllowed("mainnet", env)).toThrow("Mainnet access is disabled");
  });

  it("does not throw for mainnet when allowMainnet is explicitly true", () => {
    const env = { ...DEFAULT_ENV_CONFIG, allowMainnet: true };
    expect(() => assertNetworkAllowed("mainnet", env)).not.toThrow();
  });

  it("does not throw for testnet even when allowMainnet is true", () => {
    const env = { ...DEFAULT_ENV_CONFIG, allowMainnet: true };
    expect(() => assertNetworkAllowed("testnet", env)).not.toThrow();
  });
});
