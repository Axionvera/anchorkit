# Security Notes

AnchorKit is developer tooling and a reference example. Treat it as un-audited unless a third
party security review has been posted in this repository.

## Hard rules

1. **Do not copy secrets into the web dashboard.** The dashboard is a client-side Next.js app.
   Secret keys pasted into validation inputs never leave the browser in the MVP, but you have
   no audit of third-party browser extensions. Treat the Accounts generator as throwaway
   testnet-only identity tooling.
2. **Do not enable mainnet on a publicly hosted dashboard.** Mainnet is opt-in only in code.
   If you deploy a hosted version, keep testnet-only routing.
3. **Do not custody real user funds.** Nothing in AnchorKit implements secure key storage,
   HSM-backed signers, spend policies, or withdrawal authorisation. The contract escrow only
   gates the release of milestones after evidence + approval; it does not attempt to be a full
   multisig treasury.
4. **Redact everything before logging.** `createStellarError` in `stellar-kit` attempts to
   redact S-prefixed 56-char secrets from error messages and cause stacks. Any new log lines
   you add should go through the same sanitiser: `redactSecrets(str)` from stellar-kit.
5. **Validate callbacks.** SEP flows hit user-provided callback URLs. The MVP rejects
   non-HTTPS URLs (except localhost) via `validateCallbackUrl`. In production you will also
   want allow-lists, HMAC signatures, and retries with exponential backoff.
6. **Inputs first, network calls later.** All public package APIs validate inputs with Zod
   before touching the network. Follow the same pattern when adding new utilities.

## Escrow contract-specific threats

- The contract uses a single admin address; multi-admin / role-based access is not present in
  the MVP and should be added before real value is held.
- `release_milestone` is admin-gated but does not itself perform a token transfer; the
  released milestone is a state flag. In a production integration the release should atomically
  move assets using the token admin or a pre-funded escrow account controlled by the contract.
- Dispute resolution is manual and one-way in the MVP. A resolve_dispute call is an obvious
  first extension.
- Amounts are raw 128-bit integers; always check decimals and asset type when bridging to a
  real token contract.

## Reporting a vulnerability

See [SECURITY.md](../SECURITY.md) for the private disclosure process. Do **not** file a public
GitHub issue for a security bug.
