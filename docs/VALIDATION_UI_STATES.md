# Validation UI States

Shared, domain-agnostic UI validation lifecycle state for forms — currently used by the payments page (payment intent builder) and the anchors page (deposit/withdrawal/asset-config/callback forms).

## Overview

Every form-level validation outcome in AnchorKit's web app maps to exactly one `ValidationUIState`:

- **`loading`** — validation/derivation is in flight; no outcome yet.
- **`invalid`** — the input is structurally wrong and must be corrected.
- **`warning`** — the input is valid but has a non-blocking issue to review.
- **`ready`** — validation passed with no issues; safe to submit.
- **`blocked`** — valid input, but an external/policy condition (mainnet safety, an unavailable diagnostic, an anchor disabling an operation for an asset) prevents proceeding right now.

`ValidationUIState` is generic and does **not** replace the two existing readiness pipelines:

- `packages/stellar-kit/src/readiness.ts`'s `TransactionReadinessState` (`"valid" | "invalid" | "blocked" | "warning" | "unavailable"`, used by the payments page's 5-stage pipeline) — see `docs/TRANSACTION_READINESS.md`.
- `packages/stellar-kit/src/intent.ts`'s `ReadinessState` (`"ready" | "warnings" | "unsafe-network" | "blocked"`) — see `docs/transaction-readiness.md`.

Both pipelines are reconciled onto the shared vocabulary via pure mapping functions (`transactionReadinessStateToUiState`, `readinessStateToUiState` in `packages/stellar-kit/src/validationState.ts`) rather than merged or rewritten. See `docs/validation-engine.md` for the `ValidationResult` engine this state system also builds on.

## State precedence

When more than one condition applies, the highest-priority state wins:

```
loading > invalid > blocked > warning > ready
```

This mirrors the priority order `readiness.ts` already uses when collapsing per-stage states into an overall state (`invalid` is checked before `blocked`, before `unavailable`/`warning` — see `deriveOverallState` in `packages/stellar-kit/src/readiness.ts`).

## Usage

```typescript
import {
  getValidationUiStateSeverity,
  deriveValidationUiState,
  transactionReadinessStateToUiState,
  readinessStateToUiState,
  badgeClasses,
  alertClasses,
} from "@anchorkit/stellar-kit";
import { validationResultToUiState } from "@anchorkit/validators";
import { anchorValidationUiState } from "@anchorkit/anchor-utils";
```

### Base derivation (result only)

```typescript
// loading -> "loading"; ok -> "ready"; not ok -> "invalid"
const state = validationResultToUiState(result, { loading });
```

### Domain-aware derivation (adds "warning"/"blocked")

```typescript
const state = deriveValidationUiState({ loading, result, blocked, hasWarnings });
```

### Anchor forms convenience wrapper

```typescript
const state = anchorValidationUiState(validateAnchorRequest("deposit", draft), {
  loading,
  blocked: !assetConfig.depositEnabled,
});
```

### Reconciling the existing readiness pipelines

```typescript
const state = transactionReadinessStateToUiState(readiness.state); // readiness.ts
const state = readinessStateToUiState(intentReadiness.state); // intent.ts
```

### Components

```tsx
import { ValidationStateBadge, ValidationStateAlert } from "@/components/ui";

<ValidationStateBadge state={state} />
<ValidationStateAlert state={state} title="Optional override">
  Optional override body — defaults to the shared headline/detail copy.
</ValidationStateAlert>
```

## Domain mapping

| State | Level | Tone | Action |
|-------|-------|------|--------|
| `loading` | info | blue | wait |
| `invalid` | error | red | review_details |
| `warning` | warning | amber | review_details |
| `ready` | success | green | none |
| `blocked` | blocked | red | review_details |

### `TransactionReadinessState` → `ValidationUIState`

| `TransactionReadinessState` | `ValidationUIState` | Why |
|---|---|---|
| `valid` | `ready` | |
| `warning` | `warning` | |
| `blocked` | `blocked` | |
| `invalid` | `invalid` | |
| `unavailable` | `blocked` | Not a user input error — an external diagnostic couldn't be determined, so we can't say "ready"; folded into the same bucket as `unsafe-network` below. |

### `ReadinessState` → `ValidationUIState`

| `ReadinessState` | `ValidationUIState` |
|---|---|
| `ready` | `ready` |
| `warnings` | `warning` |
| `unsafe-network` | `blocked` |
| `blocked` | `blocked` |

## Adding New States

`ValidationUIState` is intentionally a closed, 5-value set — new *domain* states should map onto it rather than extending it. To add a new domain mapping:

1. Add a mapping function (like `transactionReadinessStateToUiState`) to `packages/stellar-kit/src/validationState.ts`, or a convenience wrapper (like `anchorValidationUiState`) to the relevant domain package.
2. If the base display copy needs a new entry, extend `VALIDATION_UI_STATE_SEVERITY` in `packages/stellar-kit/src/severity.ts` — note this map is keyed by `ValidationUIState`, not by the domain state, so it rarely needs changes.
3. Add exhaustiveness tests covering every domain state → `ValidationUIState` mapping (see `packages/stellar-kit/test/validationState.test.ts`).
4. Update this document's mapping tables.

## Design Principles

1. **Layered by ownership**: `@anchorkit/validators` only knows the base loading/invalid/ready case from a `ValidationResult`; `@anchorkit/stellar-kit` layers "warning"/"blocked" and reconciles the readiness pipelines, since only it can see both `validators` and its own domain pipelines; `@anchorkit/anchor-utils` adds a thin anchor-specific convenience wrapper. No package reaches into state it isn't allowed to see per `docs/ARCHITECTURE.md` §3.
2. **Existing pipelines stay authoritative**: `TransactionReadinessState` and `ReadinessState` are not merged or replaced — `ValidationUIState` is the rendering layer both map onto.
3. **Single source of truth for display**: `ValidationStateBadge`/`ValidationStateAlert` (`apps/web/components/ui.tsx`) are the only place a form should render a validation state; pages must not reimplement badge/alert styling locally (see the "thin web" rule in `docs/ARCHITECTURE.md` §6).
4. **Distinct warning vs. blocked**: `warning` (amber) is always non-blocking; `blocked` (red) always means the user cannot proceed until an external/policy condition changes.
