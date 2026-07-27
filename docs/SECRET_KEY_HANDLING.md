# Secret Key Handling Rules

Every part of AnchorKit that accepts or produces a Stellar secret key must follow these
rules. Maintainers are expected to enforce these rules on every PR in the
[MAINTAINER_REVIEW_CHECKLIST.md](./MAINTAINER_REVIEW_CHECKLIST.md).

## R0 – Never log a secret key verbatim

- No `console.log(secret)`, no `pino.info({ secret })`, no debug prints.
- Use `redactSecrets()` from `@anchorkit/stellar-kit` on any string before it goes into a log
  sink or error message.
- Rust tests: do not `println!` an S-secret.

## R1 – Never echo secret keys in user-facing text unless explicitly consented

- The Accounts page shows a newly generated secret exactly once. On any re-render the value is
  collapsed to `SC…AB` via `secretKeyToRedactedString()`. There is no “copy to clipboard” by
  default.
- Validation inputs for secret keys use `<input type="password">` always.

## R2 – No local storage persistence of secret keys

- Do not `localStorage.setItem("secret", …)`, do not write secrets to a cookie, do not
  serialise them into IndexedDB, do not leave them in Next.js server logs.
- If a contributor wants an encrypted wallet workflow, that must live in a separate package
  with explicit user warnings and a password-derived encryption key.

## R3 – Never include a secret key in a URL, query param, or HTTP header value

- Secret keys must never appear in Stellar Expert links, Horizon URLs, callback URL query
  strings, or `Authorization: Bearer …` headers we construct.

## R4 – Validate structurally before deriving

- Validate secret key length, prefix, and base32 alphabet before calling
  `Keypair.fromSecret`. It keeps thrown errors predictable and avoids propagating raw strings
  into third-party lib stack traces.
- `validateSecretKeyQuietly` exists for cases where you only want a boolean answer with no
  allocated error message.

## R5 – Branded types and runtime checks

- Use `StellarSecretKey` (Zod-branded string) as the TS type wherever a secret is expected.
- Accept untrusted input as `unknown`, validate with `StellarSecretKeySchema`, then use the
  branded type through the rest of the function.

## R6 – Test fixtures do not need real secrets

- All seed fixtures under `examples/` use well-known public testnet values or synthetic
  throwaway keypairs generated inside the test. Do not commit a real secret that has ever held
  mainnet funds, even if it is “for testing”.
