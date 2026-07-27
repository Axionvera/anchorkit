import { describe, it, expect } from "vitest";
import {
  parseAssetString,
  assetToString,
  assetEquals,
  getNativeAsset,
  createIssuedAsset,
  isNativeAsset,
  isIssuedAsset,
  parseAssetList,
} from "../src";

const FRIENDBOT = "GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR";

describe("Asset parsing", () => {
  it("parses empty string and 'XLM' / 'native' into native XLM asset", () => {
    for (const input of ["", "XLM", "xlm", "native", "Native", "  native  "]) {
      const r = parseAssetString(input);
      expect(r.success, `input=${JSON.stringify(input)}`).toBe(true);
      if (r.success) {
        expect(isNativeAsset(r.data)).toBe(true);
        expect(r.data.code).toBe("XLM");
        expect(r.data.issuer).toBeNull();
      }
    }
  });

  it("parses a 'CODE:ISSUER' string into an issued asset", () => {
    const r = parseAssetString(`USDC:${FRIENDBOT}`);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(isIssuedAsset(r.data)).toBe(true);
      expect(r.data.code).toBe("USDC");
      expect(r.data.issuer).toBe(FRIENDBOT);
    }
  });

  it("rejects issued asset with no colon separator by falling back to native", () => {
    const r = parseAssetString("USDC");
    expect(r.success).toBe(true);
    if (r.success) {
      expect(isNativeAsset(r.data)).toBe(true);
    }
  });

  it("rejects issued asset with invalid public key issuer", () => {
    const r = parseAssetString("USDC:BADISSUER");
    expect(r.success).toBe(false);
  });

  it("rejects asset code that is empty or has invalid characters", () => {
    expect(createIssuedAsset.bind(null, "", FRIENDBOT)).toThrow();
    expect(createIssuedAsset.bind(null, "AB$CD", FRIENDBOT)).toThrow();
    expect(createIssuedAsset.bind(null, "TOOLONGCODE123", FRIENDBOT)).toThrow();
  });

  it("assetToString round-trips for both native and issued assets", () => {
    const native = getNativeAsset();
    expect(assetToString(native)).toBe("XLM");
    const issued = createIssuedAsset("USDC", FRIENDBOT);
    expect(assetToString(issued)).toBe(`USDC:${FRIENDBOT}`);
  });

  it("assetEquals distinguishes native, same issued, and different issued assets", () => {
    const n1 = getNativeAsset();
    const n2 = getNativeAsset();
    expect(assetEquals(n1, n2)).toBe(true);
    const i1 = createIssuedAsset("USDC", FRIENDBOT);
    const i2 = createIssuedAsset("USDC", FRIENDBOT);
    const i3 = createIssuedAsset("EURC", FRIENDBOT);
    expect(assetEquals(i1, i2)).toBe(true);
    expect(assetEquals(i1, i3)).toBe(false);
    expect(assetEquals(i1, n1)).toBe(false);
  });

  it("parseAssetList filters out invalid items silently", () => {
    const list = parseAssetList([
      "XLM",
      `USDC:${FRIENDBOT}`,
      `BAD:ISSUER`,
      `EURC:${FRIENDBOT}`,
    ]);
    expect(list.length).toBe(3);
  });
});
