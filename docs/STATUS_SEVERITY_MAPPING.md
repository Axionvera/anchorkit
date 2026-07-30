# Shared Status Badge System (issue #198)

AnchorKit uses one shared system for status variants, labels, severity mapping,
display helpers, and UI badges across payments, anchors, escrow, receipts, and
account diagnostics. The mapping layer lives in `@anchorkit/stellar-kit`; the
reusable React primitive and typed domain wrappers live in
`apps/web/components/ui.tsx`.

## Overview

Every status in AnchorKit maps to exactly one `StatusSeverity` entry with:

- **Level**: `info` | `success` | `warning` | `blocked` | `error` | `unknown`
- **Tone**: `neutral` | `amber` | `blue` | `green` | `red` (for badge styling)
- **Label**: Short display text for badges
- **Headline**: User-facing headline for alerts
- **Detail**: User-facing detail message
- **Action**: Recommended next action (optional)
- **DocLink**: Path to relevant documentation (optional)

Shared badges support:

- **Variant**: `default` | `solid`
- **Size**: `sm` | `md`
- **Indicator**: optional status dot with an optional loading pulse

## Severity Levels

| Level     | When to Use                                           |
| --------- | ----------------------------------------------------- |
| `info`    | Neutral status updates, in-progress states            |
| `success` | Completed, confirmed, funded, ready states            |
| `warning` | Non-blocking issues, needs attention but not blocking |
| `blocked` | Cannot proceed until action is taken                  |
| `error`   | Failed, disputed, critical issues                     |
| `unknown` | Status cannot be determined                           |

## Usage

```typescript
import {
  getReceiptSeverity,
  getAnchorSeverity,
  getReadinessSeverity,
  getTransactionReadinessSeverity,
  getAccountSeverity,
  getAccountDiagnosticSeverity,
  getMilestoneSeverity,
  getStatusSeverity, // unified lookup
  badgeClasses,
  badgeSizeClasses,
  alertClasses,
} from "@anchorkit/stellar-kit";
```

### Individual Lookup Functions

```typescript
const severity = getReceiptSeverity("confirmed");
// { level: "success", label: "Confirmed", tone: "green", ... }

const badgeClasses = badgeClasses(severity.tone, "default");
// "bg-green-50 text-green-700 border-green-200 ..."
```

### Unified Lookup

```typescript
const severity = getStatusSeverity("receipt", "confirmed");
// Returns StatusSeverity or null if domain/status unknown
```

### Badge Components

```tsx
import {
  AccountDiagnosticBadge,
  AnchorStatusBadge,
  MilestoneStatusBadge,
  StatusBadge,
  TransactionReadinessStatusBadge,
  TransactionReceiptBadge,
  ValidationStateBadge,
} from "@/components/ui";
import { getReceiptSeverity } from "@anchorkit/stellar-kit";

<TransactionReceiptBadge status="confirmed" />
<AnchorStatusBadge status="pending_user" />
<MilestoneStatusBadge status="disputed" />
<TransactionReadinessStatusBadge state="warning" />
<AccountDiagnosticBadge state="unavailable" />

// Use the visual primitive directly for custom layouts.
<StatusBadge severity={getReceiptSeverity("pending")} variant="solid" size="sm" />
```

Domain wrappers resolve the canonical mapping and delegate all visual rendering
to `StatusBadge`. Do not duplicate labels or Tailwind status classes in pages.

### Alert Components

```tsx
import { alertClasses } from "@anchorkit/stellar-kit";

function StatusAlert({ level, title, children }) {
  return (
    <div className={alertClasses(level)}>
      <h3>{title}</h3>
      {children}
    </div>
  );
}
```

## Domain Mappings

### Receipt Statuses

| Status      | Level   | Tone    | Action         |
| ----------- | ------- | ------- | -------------- |
| `confirmed` | success | green   | none           |
| `pending`   | info    | blue    | wait           |
| `failed`    | error   | red     | retry          |
| `rejected`  | warning | amber   | check_explorer |
| `unknown`   | unknown | neutral | check_explorer |

### Anchor Statuses

| Status            | Level   | Tone  | Action         |
| ----------------- | ------- | ----- | -------------- |
| `pending_user`    | warning | amber | review_details |
| `pending_anchor`  | info    | blue  | wait           |
| `pending_stellar` | info    | blue  | wait           |
| `completed`       | success | green | none           |
| `failed`          | error   | red   | retry          |
| `refunded`        | warning | amber | check_explorer |

### Readiness States

| State            | Level   | Tone  | Action         |
| ---------------- | ------- | ----- | -------------- |
| `ready`          | success | green | none           |
| `warnings`       | warning | amber | review_details |
| `unsafe-network` | blocked | red   | enable_mainnet |
| `blocked`        | blocked | red   | review_details |

### Transaction Readiness States

| State         | Level   | Tone    | Action         |
| ------------- | ------- | ------- | -------------- |
| `valid`       | success | green   | none           |
| `invalid`     | error   | red     | review_details |
| `blocked`     | blocked | red     | review_details |
| `warning`     | warning | amber   | review_details |
| `unavailable` | unknown | neutral | retry          |

### Account Statuses

| Status     | Level   | Tone    | Action          |
| ---------- | ------- | ------- | --------------- |
| `funded`   | success | green   | none            |
| `unfunded` | warning | amber   | fund_account    |
| `unknown`  | unknown | neutral | retry           |
| `error`    | error   | red     | contact_support |

### Account Diagnostic States

| State         | Level   | Tone    | Action         |
| ------------- | ------- | ------- | -------------- |
| `funded`      | success | green   | none           |
| `unfunded`    | warning | amber   | fund_account   |
| `invalid`     | error   | red     | review_details |
| `unavailable` | unknown | neutral | retry          |
| `unknown`     | unknown | neutral | retry          |

### Milestone Statuses

| Status               | Level   | Tone    | Action          |
| -------------------- | ------- | ------- | --------------- |
| `draft`              | info    | neutral | none            |
| `active`             | info    | blue    | none            |
| `evidence_submitted` | info    | blue    | wait            |
| `approved`           | success | green   | none            |
| `disputed`           | error   | red     | contact_support |
| `ready_for_release`  | success | green   | none            |
| `released`           | success | green   | none            |

## Adding New Statuses

1. Add the status type to `packages/types/src/index.ts`.
2. Add an exhaustive mapping to `packages/stellar-kit/src/severity.ts`.
3. Add the domain to `STATUS_BADGE_DOMAINS` if it is new.
4. Add test fixtures to `packages/stellar-kit/test/fixtures/severity.ts`.
5. Update unit tests, `examples/status-badges.example.json`, and this document.

## Examples and validation

- `examples/status-badges.example.json` contains representative rows for every
  supported status domain.
- `StatusBadgeExampleSchema` validates example structure in
  `@anchorkit/validators`.
- `pnpm check:examples` prevents mappings in examples from drifting out of
  shape.

## Design Principles

1. **Single source of truth**: One mapping per status, consumed by all UI components
2. **Exhaustive coverage**: Every domain status must have a mapping
3. **Consistent semantics**: Same tone always means the same thing
4. **Actionable guidance**: Every status should suggest a user action
5. **Documentation links**: Link to relevant docs when available
