# Stellar Secret-Key Redaction & Unsafe-Logging Guardrails

AnchorKit ships guardrails so Stellar secret keys never leak into logs,
crash reports, or CI output (issue #3). Two layers:

1. **Secret redaction primitives** (`packages/stellar-kit`) — turn a secret key
   into a safe, debuggable form.
2. **Unsafe-logging guardrails** — a drop-in safe logger that redacts secrets
   from every argument *before* it reaches `console`.

## Redaction primitives

| Function | Returns | Purpose |
|---|---|---|
| `redactSecretKey(secret)` | `RedactedSecretKey { prefix, suffix, __redacted }` | Keep only first 4 + last 4 chars. |
| `secretKeyToRedactedString(secret)` | `string` | Human-readable `SABC••••••XYZQ`. |
| `redactSecrets(input)` | `string` | Scan a string and redact any Stellar-shaped secret (`S…`, 56 chars), secret assignments (`secretKey=...`), plus `secret key` / `private key` / `seed phrase` tokens. |
| `formatRedactedSecret(redacted)` | `string` | Render a `RedactedSecretKey`. |
| `containsSecret(input)` | `boolean` | Check if a string contains any 56-character Stellar secret key or secret assignment pattern. |
| `detectUnsafePatterns(input)` | `{ hasSecrets: boolean; matches: UnsafePatternMatch[] }` | Diagnostic scan for secret-like patterns. |

`RedactedSecretKey` is a branded type (`__redacted: true`) so it can never be
mistaken for a usable key at the type level.

## Diagnostics and Error Integration

AnchorKit automatically applies redaction across error creation and account diagnostics:
- **`createStellarError`**: All error messages are sanitized at creation time via `redactSecrets(message)`.
- **`diagnoseAccount` & `diagnoseAccountInfo`**: Inputs and error outputs pass through `redactSecrets` so passing a secret key or invalid string as a public key parameter will never leak credentials in diagnostic results.


## Safe logger

```ts
import { createSafeLogger, safeLog, redactValue } from "@anchorkit/stellar-kit";

// Default logger mirrors console but redacts secrets first:
safeLog.log("user signed in", keypair.secretKey); // secret never printed

// Or build a custom one (e.g. file / remote sink):
const logger = createSafeLogger({
  log: mySink,
  error: myErrorSink,
});
logger.error("payment failed", { rawBody: responseWithToken });
```

- Every argument is stringified (objects/arrays recursively) and run through
  `redactSecrets`, so secrets inside nested JSON are also scrubbed.
- Circular references are handled (no crash on `JSON.stringify`).
- `redactValue(x)` returns the safe string without logging — useful for
  building your own messages.

## Why this matters

The most common credential leak is a raw `console.log(secretKey)` during
debugging, captured in CI logs or a stack-trace service. Replacing `console`
calls with `safeLog` removes that risk without changing call-site shape.

## Notes

- These are developer guardrails, not a substitute for secret management.
  Never commit real keys; the repo fixtures use only the public `FRIENDBOT`
  key and runtime-generated fake secrets.
- `redactSecrets` only redacts *shaped* secrets and known keyword contexts.
  Treat it as defense-in-depth, not a guaranteed sanitizer.
