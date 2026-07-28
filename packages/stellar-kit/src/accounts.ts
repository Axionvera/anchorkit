import { Horizon } from "@stellar/stellar-sdk";
type Server = InstanceType<typeof Horizon.Server>;
import type {
  AccountBalances,
  AccountInfo,
  AccountStatus,
  NetworkConfig,
  StellarPublicKey,
} from "@anchorkit/types";
import { getNetworkConfig } from "@anchorkit/config";
import type { AnchorKitEnvConfig } from "@anchorkit/config";
import { isPublicKeyValid } from "./keys";
import { createStellarError, mapHorizonError } from "./errors";

export interface AccountLoaderOptions {
  networkConfig?: NetworkConfig;
  envConfig?: AnchorKitEnvConfig;
  fetchFn?: typeof fetch;
}

function createServer(options: AccountLoaderOptions = {}): Server {
  const networkConfig = options.networkConfig ?? getNetworkConfig();
  return new Horizon.Server(networkConfig.horizonUrl, {
    allowHttp: !networkConfig.isMainnet,
  });
}

export async function loadAccount(
  publicKey: string,
  options: AccountLoaderOptions = {}
): Promise<AccountInfo> {
  if (!isPublicKeyValid(publicKey)) {
    throw createStellarError("PUBLIC_KEY_INVALID", "Cannot load account: invalid public key");
  }

  /* eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion */
  const pk = publicKey as StellarPublicKey;

  try {
    const server = createServer(options);
    const account = await server.loadAccount(publicKey);
    return {
      publicKey: pk,
      status: "funded",
      sequence: account.sequence,
      subentryCount: account.subentry_count,
      lastModifiedLedger: account.last_modified_ledger,
      balances: extractBalances(account),
    };
  } catch (err) {
    const mapped = mapHorizonError(err);
    if (mapped.code === "ACCOUNT_NOT_FOUND") {
      return {
        publicKey: pk,
        status: "unfunded",
      };
    }
    if (mapped.code === "NETWORK_ERROR") {
      return {
        publicKey: pk,
        status: "unknown",
        error: mapped.message,
      };
    }
    return {
      publicKey: pk,
      status: "error",
      error: mapped.message,
    };
  }
}

export async function getAccountStatus(
  publicKey: string,
  options: AccountLoaderOptions = {}
): Promise<AccountStatus> {
  const info = await loadAccount(publicKey, options);
  return info.status;
}

export function isAccountFunded(status: AccountStatus): boolean {
  return status === "funded";
}

export function isAccountUnfunded(status: AccountStatus): boolean {
  return status === "unfunded";
}

export function isAccountStatusKnown(status: AccountStatus): boolean {
  return status === "funded" || status === "unfunded";
}

function extractBalances(account: Horizon.AccountResponse): AccountBalances {
  const balances: AccountBalances = {
    native: "0",
    assets: [],
  };

  for (const b of account.balances) {
    if (b.asset_type === "native") {
      balances.native = b.balance;
    } else if ("asset_code" in b && "asset_issuer" in b) {
      balances.assets.push({
        code: b.asset_code,
        issuer: b.asset_issuer,
        balance: b.balance,
        limit: "limit" in b ? b.limit : undefined,
      });
    }
  }

  return balances;
}

export function getTestnetFriendbotUrl(publicKey: string): string | null {
  if (!isPublicKeyValid(publicKey)) {
    return null;
  }
  const network = getNetworkConfig("testnet");
  return `${network.horizonUrl}/friendbot?addr=${encodeURIComponent(publicKey)}`;
}
