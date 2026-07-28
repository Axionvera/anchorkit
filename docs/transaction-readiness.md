# Transaction readiness engine (issue #21)

AnchorKit exposes one reusable, cross-package **transaction readiness engine**
so packages and UI screens validate account state, asset, amount, memo,
network mode, and submission safety consistently — before any transaction is
built. It is testnet-first and never submits real payments.

## Result shape

```ts
type ReadinessState = "ready" | "warnings" | "unsafe-network" | "blocked";

interface ReadinessStage {
  id: string;        // "account-source" | "asset" | "amount" | ...
  label: string;     // "Source account"
  status: "pass" | "warn" | "fail";
  warnings: ReadinessWarning[];
}

interface TransactionReadiness {
  ready: boolean;          // true when no error-severity warnings
  state: ReadinessState;   // typed aggregate outcome
  warnings: ReadinessWarning[];
  stages: ReadinessStage[]; // per-stage results, in execution order
  summary: string;
}
```

The `state` field is the single source of truth for UI branching:

| state | meaning |
| --- | --- |
| `ready` | no warnings at all |
| `warnings` | only non-blocking warnings (e.g. same source/dest) |
| `unsafe-network` | a mainnet/network-safety blocker is present |
| `blocked` | one or more hard errors (bad key, bad asset, insufficient funds) |

## Validation stages

The engine runs these stages in order, each producing a typed result:

1. **account-source** — source public key validity.
2. **account-dest** — destination public key validity + same-source/dest check.
3. **asset** — asset configuration validity.
4. **amount** — amount validity / allowed range.
5. **memo** — memo value valid for its type.
6. **network** — mainnet-safety (disabled by default).
7. **balance** — funding (unfunded warnings) + native spendable-balance check.

## API

```ts
import {
  estimateTransactionReadinessSync,
  estimateTransactionReadiness,   // async: loads accounts, computes balance model
  getReadinessState,
  mapReadinessToErrorCode,
} from "@anchorkit/stellar-kit";

const r = estimateTransactionReadinessSync(intent, { network: "testnet" });
if (r.state === "blocked" || r.state === "unsafe-network") {
  // do not build/sign
}
const code = mapReadinessToErrorCode(r.warnings); // first error code, for logs
```

The async `estimateTransactionReadiness` additionally loads the source/dest
accounts and computes the spendable balance model, surfacing `SOURCE_UNFUNDED`
/ `DEST_UNFUNDED` / `INSUFFICIENT_FUNDS` / `SPENDABLE_UNKNOWN` warnings.

## UI

`apps/web/app/payments/page.tsx` uses the engine directly: it shows the typed
`state` badge (Ready / Ready with warnings / Unsafe network / Blocked) and a
per-stage status grid, plus the full warning list. Submission is disabled
unless `state === "ready" || "warnings"`.

## Fixtures & tests

- `examples/payment-readiness.example.json` — deterministic intent + expected
  `state`/`stages` for docs and examples.
- `packages/stellar-kit/test/readiness.test.ts` — covers valid, invalid
  (asset/amount), unfunded, insufficient-funds, and unsafe-network scenarios,
  plus the typed `state` and `mapReadinessToErrorCode` helpers.

## Safety

- Testnet-first: `DEFAULT_ENV_CONFIG` disables mainnet; the engine emits
  `MAINNET_DISABLED` (→ `unsafe-network`) when mainnet is requested without
  explicit enablement.
- The engine only reads/validates; it never builds or submits a transaction.
