import type { NetworkConfig, StellarNetwork } from "@anchorkit/types";
import { STELLAR_NETWORKS } from "@anchorkit/types";

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
    throw new Error(
      "Mainnet access is disabled by default for safety. Set allowMainnet: true in env config only after reviewing security notes."
    );
  }
}
