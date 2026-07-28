import { describe, it, expect } from "vitest";
import {
  resolveAssetDisplay,
  resolveAssetDisplaySafe,
} from "../src/assetDisplay";
import { getNativeAsset, createIssuedAsset } from "../src/assets";
import { DEFAULT_TESTNET_REGISTRY, createAssetRegistry } from "../src/assetRegistry";
import type { StellarAsset } from "@anchorkit/types";

const testnetUsdc: StellarAsset = createIssuedAsset(
  "USDC",
  "GC5HTWCIAUD72MGI7AHMJEF5ZJRKXS7II2PYVYOJEYKN4UYH6QTPCPZV"
);

const unknownAsset: StellarAsset = createIssuedAsset(
  "RANDOM",
  "GA5ZSEJYB4J7FEWIOISDVX2ENQ3FAWQFS2ITYMYCU5Q3XTPTVNNROQZP"
);

describe("resolveAssetDisplay", () => {
  it("resolves native XLM with state 'native' on any network", () => {
    const xlm = getNativeAsset();
    const r = resolveAssetDisplay(xlm, "testnet");
    expect(r.state).toBe("native");
    expect(r.error).toBeNull();
    expect(r.metadata).not.toBeNull();
    expect(r.metadata!.code).toBe("XLM");
    expect(r.metadata!.displayName).toBe("Stellar Lumens");
    expect(r.metadata!.issuer).toBeNull();
    expect(r.metadata!.iconPlaceholder.character).toBe("X");
    expect(r.metadata!.iconPlaceholder.bgColor).toBe("bg-stellar-500");
    expect(r.metadata!.networks).toEqual(["testnet", "mainnet", "futurenet"]);
  });

  it("resolves a registered testnet asset with state 'issued'", () => {
    const r = resolveAssetDisplay(testnetUsdc, "testnet");
    expect(r.state).toBe("issued");
    expect(r.error).toBeNull();
    expect(r.metadata).not.toBeNull();
    expect(r.metadata!.code).toBe("USDC");
    expect(r.metadata!.issuer).toBe(testnetUsdc.issuer);
    expect(r.metadata!.iconPlaceholder.character).toBe("U");
    expect(r.metadata!.networks).toEqual(["testnet"]);
  });

  it("resolves a testnet-only asset on mainnet with state 'unsupported' and error", () => {
    const r = resolveAssetDisplay(testnetUsdc, "mainnet");
    expect(r.state).toBe("unsupported");
    expect(r.error).not.toBeNull();
    expect(r.error).toContain("testnet-only");
    expect(r.metadata).not.toBeNull();
    expect(r.metadata!.code).toBe("USDC");
  });

  it("resolves an unregistered issued asset with state 'unsupported' and error", () => {
    const r = resolveAssetDisplay(unknownAsset, "testnet");
    expect(r.state).toBe("unsupported");
    expect(r.error).not.toBeNull();
    expect(r.error).toContain("not in the asset registry");
    expect(r.metadata).not.toBeNull();
    expect(r.metadata!.code).toBe("RANDOM");
  });

  it("uses a custom registry when provided", () => {
    const customAsset = createIssuedAsset(
      "CUSTOM",
      "GA5ZSEJYB4J7FEWIOISDVX2ENQ3FAWQFS2ITYMYCU5Q3XTPTVNNROQZP"
    );
    const registry = createAssetRegistry([
      { asset: customAsset, networks: ["mainnet", "testnet"] },
    ]);
    const r = resolveAssetDisplay(customAsset, "mainnet", registry);
    expect(r.state).toBe("issued");
    expect(r.error).toBeNull();
    expect(r.metadata).not.toBeNull();
    expect(r.metadata!.code).toBe("CUSTOM");
  });
});

describe("resolveAssetDisplaySafe", () => {
  it("returns state 'unknown' for a structurally invalid input", () => {
    const r = resolveAssetDisplaySafe(
      { type: "issued", code: "", issuer: "" },
      "testnet"
    );
    expect(r.state).toBe("unknown");
    expect(r.metadata).toBeNull();
    expect(r.error).not.toBeNull();
  });

  it("returns state 'unknown' for a non-object input", () => {
    const r = resolveAssetDisplaySafe("not-an-asset", "testnet");
    expect(r.state).toBe("unknown");
    expect(r.metadata).toBeNull();
    expect(r.error).not.toBeNull();
  });

  it("delegates to resolveAssetDisplay for valid inputs", () => {
    const xlm = getNativeAsset();
    const r = resolveAssetDisplaySafe(xlm, "mainnet");
    expect(r.state).toBe("native");
    expect(r.error).toBeNull();
    expect(r.metadata).not.toBeNull();
  });
});
