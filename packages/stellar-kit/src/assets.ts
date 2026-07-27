import type { IssuedAsset, NativeAsset, StellarAsset } from "@anchorkit/types";
import { StellarAssetSchema } from "@anchorkit/validators";
import type { SafeParseReturnType } from "zod";
import { createStellarError } from "./errors";

const NATIVE_ASSET: NativeAsset = {
  type: "native",
  code: "XLM",
  issuer: null,
};

export function getNativeAsset(): NativeAsset {
  return NATIVE_ASSET;
}

export function isNativeAsset(asset: StellarAsset): asset is NativeAsset {
  return asset.type === "native";
}

export function isIssuedAsset(asset: StellarAsset): asset is IssuedAsset {
  return asset.type === "issued";
}

export function createIssuedAsset(code: string, issuer: string): IssuedAsset {
  const result = StellarAssetSchema.safeParse({
    type: "issued",
    code,
    issuer,
  });
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    throw createStellarError(
      "ASSET_INVALID",
      firstIssue?.message ?? "Invalid issued asset configuration"
    );
  }
  return result.data as IssuedAsset;
}

export function parseAssetString(input: string): SafeParseReturnType<string, StellarAsset> {
  const trimmed = input.trim();

  if (!trimmed) {
    return StellarAssetSchema.safeParse({
      type: "native",
      code: "XLM",
      issuer: null,
    }) as unknown as SafeParseReturnType<string, StellarAsset>;
  }

  if (trimmed.toLowerCase() === "xlm" || trimmed.toLowerCase() === "native") {
    return StellarAssetSchema.safeParse({
      type: "native",
      code: "XLM",
      issuer: null,
    }) as unknown as SafeParseReturnType<string, StellarAsset>;
  }

  const parts = trimmed.split(":");
  if (parts.length !== 2) {
    return StellarAssetSchema.safeParse({
      type: "native",
      code: "XLM",
      issuer: null,
    }) as unknown as SafeParseReturnType<string, StellarAsset>;
  }

  const [code, issuer] = parts as [string, string];
  return StellarAssetSchema.safeParse({
    type: "issued",
    code,
    issuer,
  }) as unknown as SafeParseReturnType<string, StellarAsset>;
}

export function validateAsset(asset: unknown): SafeParseReturnType<unknown, StellarAsset> {
  return StellarAssetSchema.safeParse(asset);
}

export function isAssetValid(asset: unknown): boolean {
  return validateAsset(asset).success;
}

export function assetToString(asset: StellarAsset): string {
  if (isNativeAsset(asset)) {
    return "XLM";
  }
  return `${asset.code}:${asset.issuer}`;
}

export function assetEquals(a: StellarAsset, b: StellarAsset): boolean {
  if (a.type !== b.type) return false;
  if (a.type === "native" && b.type === "native") return true;
  if (a.type === "issued" && b.type === "issued") {
    return a.code === b.code && a.issuer === b.issuer;
  }
  return false;
}

export function parseAssetList(inputs: string[]): StellarAsset[] {
  const assets: StellarAsset[] = [];
  for (const input of inputs) {
    const result = parseAssetString(input);
    if (result.success) {
      assets.push(result.data);
    }
  }
  return assets;
}
