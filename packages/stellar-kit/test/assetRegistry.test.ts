import { describe, it, expect } from "vitest";
import {
  createAssetRegistry,
  lookupAsset,
  validateAssetOnNetwork,
  checkAssetOnNetwork,
  DEFAULT_TESTNET_REGISTRY,
} from "../src/assetRegistry";
import { getNativeAsset, createIssuedAsset } from "../src/assets";
import type { StellarAsset } from "@anchorkit/types";

const testnetUsdc: StellarAsset = createIssuedAsset(
  "USDC",
  "GC5HTWCIAUD72MGI7AHMJEF5ZJRKXS7II2PYVYOJEYKN4UYH6QTPCPZV"
);

describe("assetRegistry — lookup", () => {
  it("always supports native XLM on any network", () => {
    const xlm = getNativeAsset();
    expect(lookupAsset(xlm, "mainnet").support).toBe("supported");
    expect(lookupAsset(xlm, "testnet").support).toBe("supported");
  });

  it("supports a registered testnet asset on testnet", () => {
    const r = lookupAsset(testnetUsdc, "testnet");
    expect(r.support).toBe("supported");
    expect(r.error).toBeNull();
  });

  it("flags a testnet-only asset as testnetOnly on mainnet", () => {
    const r = lookupAsset(testnetUsdc, "mainnet");
    expect(r.support).toBe("testnetOnly");
    expect(r.error?.code).toBe("ASSET_UNSUPPORTED");
  });

  it("returns unsupported for an unregistered issued asset", () => {
    const other = createIssuedAsset(
      "XYZ",
      "GABCABCABCABCABCABCABCABCABCABCABCABCABCABCABCABCABCABCA"
    );
    const r = lookupAsset(other, "testnet");
    expect(r.support).toBe("unsupported");
    expect(r.error?.code).toBe("ASSET_UNSUPPORTED");
  });
});

describe("assetRegistry — validation", () => {
  it("validates a supported asset on its network", () => {
    expect(() => validateAssetOnNetwork(testnetUsdc, "testnet")).not.toThrow();
  });

  it("throws ASSET_UNSUPPORTED for testnet-only asset on mainnet", () => {
    expect(() => validateAssetOnNetwork(testnetUsdc, "mainnet")).toThrow(
      /testnet-only|not supported/i
    );
  });

  it("throws ASSET_INVALID for a structurally invalid asset", () => {
    expect(() =>
      validateAssetOnNetwork({ type: "issued", code: "", issuer: "" }, "testnet")
    ).toThrow();
  });

  it("checkAssetOnNetwork returns a safe result (no throw)", () => {
    const ok = checkAssetOnNetwork(testnetUsdc, "testnet");
    expect(ok.ok).toBe(true);
    const bad = checkAssetOnNetwork(testnetUsdc, "mainnet");
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.code).toBe("ASSET_UNSUPPORTED");
  });

  it("checkAssetOnNetwork reports ASSET_INVALID for bad structure", () => {
    const res = checkAssetOnNetwork({ type: "bogus" }, "testnet");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe("ASSET_INVALID");
  });
});

describe("assetRegistry — custom registry", () => {
  it("honors a user-supplied registry with mainnet assets", () => {
    const mainnetUsdc = createIssuedAsset(
      "USDC",
      "GA5ZSEJYB4J7FEWIOISDVX2ENQ3FAWQFS2ITYMYCU5Q3XTPTVNNROQZP"
    );
    const reg = createAssetRegistry([
      { asset: mainnetUsdc, networks: ["mainnet", "testnet"] },
    ]);
    expect(lookupAsset(mainnetUsdc, "mainnet", reg).support).toBe("supported");
    expect(lookupAsset(mainnetUsdc, "testnet", reg).support).toBe("supported");
  });

  it("DEFAULT_TESTNET_REGISTRY contains the demo USDC", () => {
    expect(DEFAULT_TESTNET_REGISTRY.entries.length).toBe(1);
    expect(DEFAULT_TESTNET_REGISTRY.entries[0].testnetOnly).toBe(true);
  });
});
