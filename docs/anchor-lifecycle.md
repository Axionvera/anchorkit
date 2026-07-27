# Anchor Transaction Lifecycle (SEP-style)

AnchorKit models the anchor transaction lifecycle used by SEP-6/24/31-style
flows (issue #5). This is a developer utility package, not a production SEP
server — it gives you typed states, transition rules, and mock records to build
and test anchor UIs.

## States

| Status | Meaning |
|---|---|
| `pending_user` | Waiting for the user's action (KYC, deposit). |
| `pending_anchor` | Anchor is reviewing / processing the request. |
| `pending_stellar` | Submitted to Stellar, awaiting confirmation. |
| `completed` | Funds delivered (terminal). |
| `failed` | Terminal error state. |
| `refunded` | Funds returned to the user (terminal). |

## Transition graph

```
pending_user → pending_anchor → pending_stellar → completed
                                   │
                                   ├──→ failed
                                   └──→ refunded
```

Only the edges above are legal. Terminal states (`completed`, `failed`,
`refunded`) have no outgoing transitions.

## State machine API

```ts
import {
  isTransitionValid,
  transition,
  nextStatus,
  findFirstIllegalTransition,
  ALLOWED_TRANSITIONS,
  TERMINAL_STATUSES,
} from "@anchorkit/anchor-utils";

isTransitionValid("pending_user", "pending_anchor"); // true
isTransitionValid("pending_user", "completed");       // false

transition("pending_user", "completed");
// { ok: false, error: "Illegal transition 'pending_user' → 'completed'..." }

transition("pending_stellar", "failed");
// { ok: true, status: "failed" }

nextStatus("pending_anchor"); // "pending_stellar"
nextStatus("completed");      // null (terminal)

findFirstIllegalTransition(["pending_user", "completed"]);
// { from: "pending_user", to: "completed", index: 1 }
```

## Mock records & UI

`anchor-utils` also ships:

- `createMockAnchorTransactionRecord(params)` — build a typed
  `AnchorTransactionRecord` for any status.
- `buildDepositLifecycle()` / `buildWithdrawalLifecycle()` — full timelines
  across the legal states, useful for rendering a lifecycle timeline in the UI.
- `anchorStatusToUserMessage(status, kind)` / `anchorStatusBadge(status)` —
  user-facing copy and badge styles per status.

The web demo (`apps/web/app/anchors`) renders both the deposit/withdrawal
lifecycle timelines and an interactive **Lifecycle transitions** panel that uses
the state machine to flag illegal moves live.

## Notes

- `advanceAnchorTransactionStatus` (existing helper) still walks the happy path
  for convenience, but the state machine above is the source of truth for
  validity. New code should use `transition` / `isTransitionValid`.
- This is a developer utility, not a production SEP server. Build your own
  SEP-6/24/31 backend on top of these primitives.

