# Status Severity Mapping

Single source of truth for mapping domain-specific statuses to canonical severity levels, badge tones, headlines, detail messages, recommended actions, and documentation links.

## Overview

Every status in AnchorKit maps to exactly one `StatusSeverity` entry with:

- **Level**: `info` | `success` | `warning` | `blocked` | `error` | `unknown`
- **Tone**: `neutral` | `amber` | `blue` | `green` | `red` (for badge styling)
- **Label**: Short display text for badges
- **Headline**: User-facing headline for alerts
- **Detail**: User-facing detail message
- **Action**: Recommended next action (optional)
- **DocLink**: Path to relevant documentation (optional)

## Severity Levels

| Level | When to Use |
|-------|-------------|
| `info` | Neutral status updates, in-progress states |
| `success` | Completed, confirmed, funded, ready states |
| `warning` | Non-blocking issues, needs attention but not blocking |
| `blocked` | Cannot proceed until action is taken |
| `error` | Failed, disputed, critical issues |
| `unknown` | Status cannot be determined |

## Usage

```typescript
import {
  getReceiptSeverity,
  getAnchorSeverity,
  getReadinessSeverity,
  getAccountSeverity,
  getMilestoneSeverity,
  getStatusSeverity,  // unified lookup
  badgeClasses,
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
import { badgeClasses, getReceiptSeverity } from "@anchorkit/stellar-kit";

function StatusBadge({ status }) {
  const { label, tone } = getReceiptSeverity(status);
  return (
    <span className={badgeClasses(tone)}>
      {label}
    </span>
  );
}
```

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

| Status | Level | Tone | Action |
|--------|-------|------|--------|
| `confirmed` | success | green | none |
| `pending` | info | blue | wait |
| `failed` | error | red | retry |
| `rejected` | warning | amber | check_explorer |
| `unknown` | unknown | neutral | check_explorer |

### Anchor Statuses

| Status | Level | Tone | Action |
|--------|-------|------|--------|
| `pending_user` | warning | amber | review_details |
| `pending_anchor` | info | blue | wait |
| `pending_stellar` | info | blue | wait |
| `completed` | success | green | none |
| `failed` | error | red | retry |
| `refunded` | warning | amber | check_explorer |

### Readiness States

| State | Level | Tone | Action |
|-------|-------|------|--------|
| `ready` | success | green | none |
| `warnings` | warning | amber | review_details |
| `unsafe-network` | blocked | red | enable_mainnet |
| `blocked` | blocked | red | review_details |

### Account Statuses

| Status | Level | Tone | Action |
|--------|-------|------|--------|
| `funded` | success | green | none |
| `unfunded` | warning | amber | fund_account |
| `unknown` | unknown | neutral | retry |
| `error` | error | red | contact_support |

### Milestone Statuses

| Status | Level | Tone | Action |
|--------|-------|------|--------|
| `draft` | info | neutral | none |
| `active` | info | blue | none |
| `evidence_submitted` | info | blue | wait |
| `approved` | success | green | none |
| `disputed` | error | red | contact_support |
| `ready_for_release` | success | green | none |
| `released` | success | green | none |

## Adding New Statuses

1. Add the status type to `packages/types/src/index.ts`
2. Add severity mapping to `packages/stellar-kit/src/severity.ts`
3. Add test fixtures to `packages/stellar-kit/test/fixtures/severity.ts`
4. Update tests in `packages/stellar-kit/test/severity.test.ts`
5. Update this documentation

## Design Principles

1. **Single source of truth**: One mapping per status, consumed by all UI components
2. **Exhaustive coverage**: Every domain status must have a mapping
3. **Consistent semantics**: Same tone always means the same thing
4. **Actionable guidance**: Every status should suggest a user action
5. **Documentation links**: Link to relevant docs when available
