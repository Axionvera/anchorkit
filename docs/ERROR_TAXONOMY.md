# AnchorKit Shared Error Taxonomy

AnchorKit implements a shared, secret-safe, and typed error taxonomy across all monorepo packages (`@anchorkit/types`, `@anchorkit/config`, `@anchorkit/validators`, `@anchorkit/stellar-kit`, `@anchorkit/anchor-utils`, and `apps/web`).

---

## 🎯 Architecture & Goals

1. **Secret-Safe Defaults**: No raw secret keys (`S...`), seed phrases, or private credentials are ever leaked in error messages, stack traces, or UI output.
2. **Stable Categories & Codes**: Callers and frontend components branch on typed `category` and `code` fields instead of parsing raw error strings or Zod internal issues.
3. **User-Safe Fallbacks**: Every error carries a human-readable `userSafeMessage` safe to display directly to end-users in notifications or UI alerts.

---

## 🏷️ Error Categories

Errors are classified into 8 top-level categories:

| Category | Description | Primary Package / Source |
|---|---|---|
| `VALIDATION` | Schema, format, or range errors on input data | `@anchorkit/validators` |
| `NETWORK` | Horizon API, Soroban RPC, HTTP fetch, or connection timeouts | `@anchorkit/stellar-kit` |
| `PAYMENT` | Payment intent, asset balance, memo, or transaction errors | `@anchorkit/stellar-kit` |
| `ANCHOR` | SEP anchor status, rail metadata, or illegal lifecycle moves | `@anchorkit/anchor-utils` |
| `SECRET` | Secret key validation failures, unauthorized access, or redactions | `@anchorkit/stellar-kit` |
| `CONFIG` | Missing env vars, invalid network config, or mainnet safety blocks | `@anchorkit/config` |
| `ESCROW` | Soroban escrow milestone, event decode, or contract errors | `@anchorkit/stellar-kit` |
| `UNKNOWN` | Unexpected fallback or untyped runtime exceptions | Core fallback |

---

## 🔑 Error Structure (`AnchorKitError`)

```ts
import { AnchorKitError } from "@anchorkit/types";

export interface AnchorKitErrorDetails {
  category: AnchorKitErrorCategory;
  code: AnchorKitErrorCode;
  message: string;
  userSafeMessage: string;
  details?: Record<string, unknown>;
  cause?: unknown;
  redacted: true;
}
```

### Instantiating typed errors:

```ts
import { createAnchorKitError } from "@anchorkit/types";

throw createAnchorKitError({
  category: "CONFIG",
  code: "MAINNET_DISABLED",
  message: "Mainnet access is disabled by default for safety.",
  userSafeMessage: "Mainnet access is currently disabled. Enable allowMainnet in config to proceed.",
});
```

---

## 🛡️ Secret Key Safety (Rules R0–R6)

All messages and details passed through `AnchorKitError` are automatically sanitized via `redactSecrets(...)`. 

Any 56-character `S...` secret key string embedded in an error message or detail object is replaced with prefix/suffix redaction (e.g. `SDJL...234` → `SDJL[REDACTED]234`).

---

## 💻 Consumer & Web UI Error Handling

Frontend components and web applications use `mapErrorToUserSafeMessage(error: unknown)` to normalize any thrown exception into a structured UI payload:

```ts
import { mapErrorToUserSafeMessage } from "@anchorkit/types";

try {
  await submitTransaction();
} catch (err) {
  const safeError = mapErrorToUserSafeMessage(err);
  
  // Safe to render directly in UI components
  console.log(safeError.title);           // e.g. "Network Connection Error"
  console.log(safeError.userSafeMessage); // e.g. "Stellar network is currently unavailable."
  console.log(safeError.category);        // "NETWORK"
  console.log(safeError.code);            // "HORIZON_ERROR"
}
```

---

## 🧪 Testing Coverage

Error categories, secret redaction, and user-safe mapping are covered by tests across the workspace:
- `@anchorkit/types`: `packages/types/test/errors.test.ts`
- `@anchorkit/config`: `packages/config/test/mainnet-safety.test.ts`
- `@anchorkit/validators`: `packages/validators/test/validationEngine.test.ts`
- `@anchorkit/stellar-kit`: `packages/stellar-kit/test/`
- `@anchorkit/anchor-utils`: `packages/anchor-utils/test/lifecycle.test.ts`
