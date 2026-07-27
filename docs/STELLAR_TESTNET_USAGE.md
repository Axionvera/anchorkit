# Stellar Testnet Usage

AnchorKit targets Stellar **Testnet** by default. This is deliberate: it keeps local iteration
fast, removes risk of accidental mainnet spend, and aligns with the project’s purpose as a
developer toolkit.

## Default endpoints

| Network | Horizon URL | Soroban RPC (optional) | Passphrase |
| --- | --- | --- | --- |
| testnet (default) | `https://horizon-testnet.stellar.org` | `https://soroban-testnet.stellar.org` | `Test SDF Network ; September 2015` |
| mainnet (gated) | `https://horizon.stellar.org` | `https://soroban.stellar.org` | `Public Global Stellar Network ; September 2015` |
| futurenet | `https://horizon-futurenet.stellar.org` | `https://rpc-futurenet.stellar.org` | `Test SDF Future Network ; October 2022` |

These are exposed via `@anchorkit/config` → `NETWORK_CONFIGS` and `getNetworkConfig(network)`.

## Funding testnet accounts

The Accounts page in the dashboard links directly to:

```
https://horizon-testnet.stellar.org/friendbot?addr=<public key>
```

Use Friendbot to fund newly generated testnet keypairs. Friendbot is a public testnet service.
Do not rely on it uptime for production; it is a convenience for development.

## Live vs. mock network activity in the MVP

- **Accounts page** – calls Horizon `GET /accounts/<pubkey>` to check funded/unfunded status.
- **Payments page** – runs readiness checks locally unless a contributor wires a testnet-only
  mock submission mode. No real transactions are submitted out-of-the-box.
- **Anchors page** – purely local fixtures and parsing. No HTTP calls.
- **Escrow page** – purely local UI mock. Deploy the contract to testnet with Soroban CLI for
  live integration.

## Enabling mainnet (advanced)

`DEFAULT_ENV_CONFIG.allowMainnet = false`. Change this only:

1. After reviewing [SECURITY_NOTES.md](./SECURITY_NOTES.md) and
   [SECRET_KEY_HANDLING.md](./SECRET_KEY_HANDLING.md).
2. In a deploy configuration that can never be accidentally shipped into the public dashboard.
3. With extra rate-limiting, Horizon timeout tuning, and explicit user warnings.

The web dashboard intentionally does not have a UI toggle for mainnet. It is config-only.

## Rate limits and idempotency

- Default Horizon timeout is 10 seconds.
- The public Stellar testnet Horizon rate-limits aggressively if you script hundreds of calls
  per second. `@anchorkit/config` exposes `horizonRateLimitPerSecond` as a documented default.
- Payments submission, if added later, must be idempotency-keyed and should prefer the
  Soroban classic `submitTransaction` flow with fee bumps for reliability.
