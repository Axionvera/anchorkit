import type { NetworkConfig, StellarNetwork } from "@anchorkit/types";
import { STELLAR_NETWORKS, createAnchorKitError } from "@anchorkit/types";

const TESTNET_CONFIG: NetworkConfig = {
  network: STELLAR_NETWORKS.TESTNET,
  horizonUrl: "https://horizon-testnet.stellar.org",
  sorobanRpcUrl: "https://soroban-testnet.stellar.org",
  networkPassphrase: "Test SDF Network ; September 2015",
  friendlyName: "Stellar Testnet",
  isMainnet: false,
  expertBaseUrl: "https://stellar.expert/explorer/testnet",
};

const MAINNET_CONFIG: NetworkConfig = {
  network: STELLAR_NETWORKS.MAINNET,
  horizonUrl: "https://horizon.stellar.org",
  sorobanRpcUrl: "https://soroban.stellar.org",
  networkPassphrase: "Public Global Stellar Network ; September 2015",
  friendlyName: "Stellar Mainnet",
  isMainnet: true,
  expertBaseUrl: "https://stellar.expert/explorer/public",
};

const FUTURENET_CONFIG: NetworkConfig = {
  network: STELLAR_NETWORKS.FUTURENET,
  horizonUrl: "https://horizon-futurenet.stellar.org",
  sorobanRpcUrl: "https://rpc-futurenet.stellar.org",
  networkPassphrase: "Test SDF Future Network ; October 2022",
  friendlyName: "Stellar Futurenet",
  isMainnet: false,
  expertBaseUrl: "https://stellar.expert/explorer/futurenet",
};

export const NETWORK_CONFIGS: Record<StellarNetwork, NetworkConfig> = {
  testnet: TESTNET_CONFIG,
  mainnet: MAINNET_CONFIG,
  futurenet: FUTURENET_CONFIG,
};

export const DEFAULT_NETWORK: StellarNetwork = STELLAR_NETWORKS.TESTNET;

export const DEFAULT_FEATURE_FLAGS: Record<string, FeatureFlagDefinition> = {
  experimental_soroban: {
    id: "experimental_soroban",
    name: "Experimental Soroban Support",
    description: "Enables experimental Soroban smart contract operations and custom RPC extensions.",
    stability: "experimental",
    defaultEnabled: false,
  },
  experimental_vault: {
    id: "experimental_vault",
    name: "Experimental Vault Manager",
    description: "Enables experimental vault management, session tracking, and multi-sig escrow vault rules.",
    stability: "experimental",
    defaultEnabled: false,
  },
  mainnet_access: {
    id: "mainnet_access",
    name: "Mainnet Operations",
    description: "Allows execution against Stellar Mainnet.",
    stability: "stable",
    defaultEnabled: false,
  },
  advanced_diagnostics: {
    id: "advanced_diagnostics",
    name: "Advanced Diagnostics",
    description: "Enables enriched configuration and network diagnostic pipelines.",
    stability: "stable",
    defaultEnabled: true,
  },
};

export interface AnchorKitEnvConfig {
  defaultNetwork: StellarNetwork;
  allowMainnet: boolean;
  horizonTimeoutMs: number;
  horizonRateLimitPerSecond: number;
  maximumMemoTextBytes: number;
  minimumPaymentAmount: string;
  maximumPaymentAmount: string;
  secretKeyPrefix: string;
  publicKeyPrefix: string;
  featureFlags?: Partial<Record<FeatureFlagId, boolean>>;
}

export const DEFAULT_ENV_CONFIG: AnchorKitEnvConfig = {
  defaultNetwork: DEFAULT_NETWORK,
  allowMainnet: false,
  horizonTimeoutMs: 10_000,
  horizonRateLimitPerSecond: 50,
  maximumMemoTextBytes: 28,
  minimumPaymentAmount: "0.0000001",
  maximumPaymentAmount: "999999999999.9999999",
  secretKeyPrefix: "S",
  publicKeyPrefix: "G",
  featureFlags: {
    experimental_soroban: false,
    experimental_vault: false,
    mainnet_access: false,
    advanced_diagnostics: true,
  },
};

export function getNetworkConfig(network: StellarNetwork = DEFAULT_NETWORK): NetworkConfig {
  return NETWORK_CONFIGS[network];
}

export function getDefaultNetworkConfig(): NetworkConfig {
  return getNetworkConfig(DEFAULT_NETWORK);
}

export function isMainnetAllowed(env: AnchorKitEnvConfig = DEFAULT_ENV_CONFIG): boolean {
  return env.allowMainnet === true;
}

export function assertNetworkAllowed(
  network: StellarNetwork,
  env: AnchorKitEnvConfig = DEFAULT_ENV_CONFIG
): void {
  if (network === STELLAR_NETWORKS.MAINNET && !isMainnetAllowed(env)) {
    throw createAnchorKitError({
      category: "CONFIG",
      code: "MAINNET_DISABLED",
      message:
        "Mainnet access is disabled by default for safety. Set allowMainnet: true in env config only after reviewing security notes.",
      userSafeMessage:
        "Mainnet access is disabled by default. Please configure allowMainnet: true to proceed.",
    });
  }
}

export function getFeatureFlagDefinitions(): FeatureFlagDefinition[] {
  return Object.values(DEFAULT_FEATURE_FLAGS);
}

export function isFeatureEnabled(
  flagId: FeatureFlagId,
  env: AnchorKitEnvConfig = DEFAULT_ENV_CONFIG
): boolean {
  if (flagId === "mainnet_access") {
    if (env.featureFlags?.mainnet_access !== undefined) {
      return env.featureFlags.mainnet_access;
    }
    return isMainnetAllowed(env);
  }

  if (env.featureFlags && flagId in env.featureFlags) {
    const val = env.featureFlags[flagId];
    if (val !== undefined) return val;
  }

  const def = DEFAULT_FEATURE_FLAGS[flagId];
  return def ? def.defaultEnabled : false;
}

export function assertFeatureEnabled(
  flagId: FeatureFlagId,
  env: AnchorKitEnvConfig = DEFAULT_ENV_CONFIG
): void {
  if (!isFeatureEnabled(flagId, env)) {
    const def = DEFAULT_FEATURE_FLAGS[flagId];
    const name = def ? def.name : flagId;
    const stability = def ? def.stability : "experimental";
    const error = new Error(
      `Feature '${name}' (${flagId}) is disabled by default. Feature stability: ${stability}. Enable it by setting featureFlags.${flagId}: true in config.`
    ) as any;
    error.code = "FEATURE_DISABLED";
    error.name = "StellarKitError";
    error.redacted = true;
    throw error;
  }
}

export function resolveConfigSourceMetadata(
  env: AnchorKitEnvConfig = DEFAULT_ENV_CONFIG
): ConfigSourceMetadata[] {
  const isDefault = env === DEFAULT_ENV_CONFIG;
  const source = isDefault ? "default" : "explicit";

  const result: ConfigSourceMetadata[] = [
    { source, key: "defaultNetwork", isSensitive: false, resolvedValue: env.defaultNetwork, stability: "stable" },
    { source, key: "allowMainnet", isSensitive: false, resolvedValue: env.allowMainnet, stability: "stable" },
    { source, key: "horizonTimeoutMs", isSensitive: false, resolvedValue: env.horizonTimeoutMs, stability: "stable" },
    { source, key: "horizonRateLimitPerSecond", isSensitive: false, resolvedValue: env.horizonRateLimitPerSecond, stability: "stable" },
    { source, key: "maximumMemoTextBytes", isSensitive: false, resolvedValue: env.maximumMemoTextBytes, stability: "stable" },
    { source, key: "minimumPaymentAmount", isSensitive: false, resolvedValue: env.minimumPaymentAmount, stability: "stable" },
    { source, key: "maximumPaymentAmount", isSensitive: false, resolvedValue: env.maximumPaymentAmount, stability: "stable" },
    { source, key: "secretKeyPrefix", isSensitive: true, resolvedValue: "[REDACTED]", stability: "stable" },
    { source, key: "publicKeyPrefix", isSensitive: false, resolvedValue: env.publicKeyPrefix, stability: "stable" },
  ];

  const definitions = getFeatureFlagDefinitions();
  for (const def of definitions) {
    const enabled = isFeatureEnabled(def.id, env);
    const flagSource = env.featureFlags && def.id in env.featureFlags ? (isDefault ? "default" : "explicit") : "default";
    result.push({
      source: flagSource,
      key: `featureFlags.${def.id}`,
      isSensitive: false,
      resolvedValue: enabled,
      stability: def.stability,
    });
  }

  return result;
}


// ─── Module capabilities ────────────────────────────────────────────────────
export * from "./capabilities";
