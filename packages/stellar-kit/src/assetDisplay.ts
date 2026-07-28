import type {
  AssetDisplayInfo,
  AssetDisplayMetadata,
  AssetIconPlaceholder,
  IssuedAsset,
  NativeAsset,
  StellarAsset,
  StellarNetwork,
} from "@anchorkit/types";
import { getNetworkConfig } from "@anchorkit/config";
import { isNativeAsset, isIssuedAsset, validateAsset, assetToString } from "./assets";
import type { AssetRegistry } from "./assetRegistry";
import { lookupAsset, DEFAULT_TESTNET_REGISTRY } from "./assetRegistry";

const NATIVE_ICON: AssetIconPlaceholder = {
  character: "X",
  bgColor: "bg-stellar-500",
};

const UNKNOWN_ICON: AssetIconPlaceholder = {
  character: "?",
  bgColor: "bg-ink-400",
};

function issuedIcon(code: string): AssetIconPlaceholder {
  return {
    character: code.charAt(0).toUpperCase(),
    bgColor: "bg-blue-500",
  };
}

function defaultDisplayName(asset: StellarAsset): string {
  if (isNativeAsset(asset)) return "Stellar Lumens";
  return `${asset.code} Issued Asset`;
}

function defaultTrustNote(asset: StellarAsset): string {
  if (isNativeAsset(asset)) {
    return "Native asset — no issuer trust required.";
  }
  return `Issued by ${asset.issuer}. Verify the issuer address before transacting.`;
}

function buildMetadata(asset: StellarAsset, entryNetworks?: StellarNetwork[]): AssetDisplayMetadata {
  if (isNativeAsset(asset)) {
    return {
      displayName: "Stellar Lumens",
      code: "XLM",
      issuer: null,
      iconPlaceholder: NATIVE_ICON,
      networks: ["testnet", "mainnet", "futurenet"],
      trustNote: "Native asset — no issuer trust required. Used for fees and reserves.",
    };
  }

  const entryNote = entryNetworks
    ? `Issued by ${asset.issuer}. Supported on: ${entryNetworks.join(", ")}.`
    : `Issued by ${asset.issuer}. Verify the issuer address before transacting.`;

  return {
    displayName: defaultDisplayName(asset),
    code: asset.code,
    issuer: asset.issuer,
    iconPlaceholder: issuedIcon(asset.code),
    networks: entryNetworks ?? [],
    trustNote: entryNote,
  };
}

function buildUnknownMetadata(asset: StellarAsset): AssetDisplayMetadata {
  return {
    displayName: defaultDisplayName(asset),
    code: asset.code,
    issuer: asset.issuer,
    iconPlaceholder: UNKNOWN_ICON,
    networks: [],
    trustNote: "This asset is not in the registry. Verify the issuer and network support independently.",
  };
}

export function resolveAssetDisplay(
  asset: StellarAsset,
  network: StellarNetwork,
  registry: AssetRegistry = DEFAULT_TESTNET_REGISTRY
): AssetDisplayInfo {
  if (isNativeAsset(asset)) {
    return {
      state: "native",
      asset,
      network,
      metadata: buildMetadata(asset),
      error: null,
    };
  }

  const lookup = lookupAsset(asset, network, registry);

  if (lookup.support === "unsupported" || lookup.support === "testnetOnly") {
    return {
      state: "unsupported",
      asset,
      network,
      metadata: buildMetadata(asset, lookup.entry?.networks),
      error: lookup.error?.message ?? "Asset is not supported on this network.",
    };
  }

  return {
    state: "issued",
    asset,
    network,
    metadata: buildMetadata(asset, lookup.entry?.networks),
    error: null,
  };
}

export function resolveAssetDisplaySafe(
  input: unknown,
  network: StellarNetwork,
  registry: AssetRegistry = DEFAULT_TESTNET_REGISTRY
): AssetDisplayInfo {
  const parsed = validateAsset(input);
  if (!parsed.success) {
    return {
      state: "unknown",
      asset: input as StellarAsset,
      network,
      metadata: null,
      error: parsed.error.issues[0]?.message ?? "Invalid asset configuration.",
    };
  }
  return resolveAssetDisplay(parsed.data, network, registry);
}
