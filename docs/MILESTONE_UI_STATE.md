# Milestone UI State Model

## Overview

The milestone UI state model is a client-side abstraction that keeps frontend
behaviour aligned with the Rust Soroban `treasury-escrow` contract rules.

It provides:

- A **type-safe action model** — every contract entry point is represented as a
  typed `MilestoneAction` with per-status availability rules.
- **Role-aware helpers** — distinguish admin-only actions from viewer-visible
  ones so the same component tree works in both admin and read-only contexts.
- **Safe evidence hash display** — validated formatting with
  not-submitted / submitted / invalid states, truncated rendering, and
  copy-to-clipboard support.
- **Aggregated UI state** — a single `MilestoneUiInfo` object that components
  consume instead of re-deriving the same logic.

## Files

| File | Purpose |
|---|---|
| `packages/types/src/milestoneUi.ts` | Type definitions + pure helpers |
| `packages/validators/src/schemas/milestoneUi.ts` | Zod validation schemas |
| `apps/web/lib/milestoneUi.ts` | Web-specific re-exports and helpers |
| `apps/web/components/MilestoneActionPanel.tsx` | Action button panel component |
| `apps/web/components/EvidenceHashDisplay.tsx` | Evidence hash display component |
| `packages/fixtures/src/milestoneUi.ts` | Per-status milestone stubs + expected action snapshots |
| `packages/types/test/milestoneUi.test.ts` | Unit tests for types and helpers |
| `apps/web/app/escrow/page.tsx` | Escrow demo page using the UI model |

## Milestone action model

### Actions

Each action maps to one Soroban contract entry point:

| Action | Contract function |
|---|---|
| `assign_amount` | `assign_amount` |
| `submit_evidence` | `submit_evidence` |
| `approve` | `approve_milestone` |
| `dispute` | `dispute_milestone` |
| `mark_ready_for_release` | `mark_ready_for_release` |
| `release` | `release_milestone` |

The `"none"` action is a display-only value for terminal / blocked statuses.

### Availability levels

| Level | Meaning |
|---|---|
| `"allowed"` | The action is available to the current user. |
| `"blocked"` | The action would fail at the contract level (e.g. releasing a released milestone). Shown disabled with a reason. |
| `"hidden"` | The action is irrelevant for the current status; not rendered. |
| `"admin_only"` | The action requires admin auth. Enabled for admin users, disabled for others. |

### Per-status rules

```
Status              Allowed actions (admin)    Non-admin sees
──────────────────────────────────────────────────────────────
draft               assign_amount              (nothing)
active              submit_evidence            (nothing)
evidence_submitted  approve, dispute           (nothing)
approved            mark_ready_for_release     (nothing)
disputed            none (display only)        none
ready_for_release   release                    (nothing)
released            none (display only)        none
```

All actions not listed above are `"hidden"` for that status.

### Transition mapping (contract DAG)

```
Draft ──assign_amount──► Active ──submit_evidence──► EvidenceSubmitted
                                                       │
                                                   ┌───┴───┐
                                                   │       │
                                               approve  dispute
                                                   │       │
                                               Approved  Disputed
                                                   │
                                        mark_ready_for_release
                                                   │
                                            ReadyForRelease
                                                   │
                                               release
                                                   │
                                              Released
```

## Evidence hash display

The `getMilestoneEvidenceDisplay` helper validates the hash before rendering:

| State | Condition | UI treatment |
|---|---|---|
| `not_submitted` | Hash is `undefined` or `""` | Grey "Not submitted" placeholder |
| `submitted` | Hash matches `/^[0-9a-fA-F]{64}$/` | Truncated (`5fece…57e9`), click-to-copy |
| `invalid` | Hash present but not valid hex of correct length | Red truncated text, click-to-copy |

This prevents malformed or unexpected data from breaking the UI.

## Usage

### Deriving UI state from a Milestone

```typescript
import { getMilestoneUiInfo } from "@anchorkit/types";

const milestone: Milestone = { /* ... */ };
const uiInfo = getMilestoneUiInfo(milestone, isAdmin);

// `uiInfo` contains:
//   status, allowedActions, actionRules, evidence, isReleased, isDisputed
```

### Checking a single action

```typescript
import { isMilestoneActionAllowed } from "@anchorkit/types";

if (isMilestoneActionAllowed("release", milestone.status, isAdmin)) {
  // show release button
}
```

### React components

```tsx
import { MilestoneActionPanel } from "@/components/MilestoneActionPanel";
import { EvidenceHashDisplay } from "@/components/EvidenceHashDisplay";

// Action panel with role-aware rendering
<MilestoneActionPanel uiInfo={uiInfo} isAdmin={true} onAction={handleAction} />

// Safe evidence display
<EvidenceHashDisplay milestone={milestone} />
```

## Relation to contract states

The UI state model is a **projection** of the contract state machine — it does
not replace or duplicate on-chain validation. Every `"admin_only"` marker in
the UI corresponds to a `require_auth` / `require_admin` gate in the Rust
contract. Every `"blocked"` rule maps to a concrete `EscrowError` variant:

| UI rule | Contract error |
|---|---|
| Can't release a released milestone | `DuplicateRelease` |
| Can't release before ready | `ReleaseBeforeApproval` |
| Can't approve a disputed milestone | `ApprovalAfterDispute` |
| Can't approve without evidence | `EvidenceRequired` |
| Can't dispute without evidence | `DisputeWithoutEvidence` |
| Can't submit evidence twice | `EvidenceAlreadySubmitted` |

## Tests

```bash
pnpm --filter @anchorkit/types test    # runs milestoneUi.test.ts
```

The test suite covers:
- Every status has correct action rules
- Admin vs non-admin role filtering
- Single-action permission checks
- Evidence hash validation (valid, missing, malformed, wrong length)
- Aggregated `MilestoneUiInfo` derivation
