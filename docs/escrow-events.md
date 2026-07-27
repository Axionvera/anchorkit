# Escrow Event Schema

AnchorKit defines a **structured escrow event schema** so frontend tooling can
consume Soroban `treasury-escrow` contract events without parsing raw topics
and `ScVal` payloads.

> Part of issue #8. The implementation lives in:
> - `packages/types/src/escrowEvents.ts` — schema, types, topic constants.
> - `packages/stellar-kit/src/escrowEvents.ts` — client mapper
>   (`parseEscrowEvent`, `parseEscrowEvents`).
> - `examples/escrow-events-example.json` — one raw event per type.

## Event topics

The contract emits one event per milestone action. The first topic is the
discriminator (kept stable — do not rename existing variants):

| Topic (discriminator) | Meaning |
|---|---|
| `milestone_created` | A milestone was registered. |
| `evidence_submitted` | Evidence hash submitted against a milestone. |
| `approved` | Admin approved the milestone. |
| `disputed` | Milestone disputed (blocks further approval). |
| `ready_for_release` | Status moved `approved → ready_for_release`. |
| `released` | Funds released for the milestone. |

The topic strings are exported as `ESCROW_EVENT_TOPICS` in `@anchorkit/types`.

## Raw event shape (what the mapper consumes)

```ts
interface RawEscrowEvent {
  contractId: string;
  topic: unknown[];          // topic[0] = discriminator, rest = args
  data: Record<string, unknown>; // decoded ScVal payload
  timestamp?: string;        // ISO-8601
  ledger?: number;
}
```

`topic[0]` may arrive as a plain string or an `ScVal`-like object
(`{ symbol }` / `{ value }`). The mapper normalises both. If a field is absent
from `data`, the mapper falls back to `topic[1]` (commonly the `milestoneId`).

## Mapped event union

`parseEscrowEvent(raw)` returns a typed `EscrowEventV1` discriminated on `type`:

```ts
type EscrowEventV1 =
  | MilestoneCreatedEvent
  | EvidenceSubmittedEvent
  | ApprovedEvent
  | DisputedEvent
  | ReadyForReleaseEvent
  | ReleasedEvent;
```

Each variant carries `milestoneId`, `timestamp`, `caller`, `contractId`, and
(optionally) `ledger`, plus type-specific fields:

| Variant | Extra fields |
|---|---|
| `MilestoneCreatedEvent` | `title`, `amount`, `description?` |
| `EvidenceSubmittedEvent` | `evidenceHash`, `note?` |
| `ApprovedEvent` | `evidenceHash?` |
| `DisputedEvent` | `disputeReason`, `evidenceHash?` |
| `ReadyForReleaseEvent` | `amount` |
| `ReleasedEvent` | `amount`, `transactionHash?` |

## Failure handling

The mapper never throws. On an undecodable event it returns:

```ts
{ ok: false; error: string; raw: RawEscrowEvent }
```

`parseEscrowEvents(raws)` returns `{ events, failures }` so a single bad event
never breaks a stream.

## Usage

```ts
import { parseEscrowEvents } from '@anchorkit/stellar-kit';
// rawEvents: RawEscrowEvent[] from server.getEvents(...) or a wallet stream
const { events, failures } = parseEscrowEvents(rawEvents);
for (const e of events) {
  switch (e.type) {
    case 'released':
      console.log(`Milestone ${e.milestoneId} paid: ${e.amount}`);
      break;
    case 'disputed':
      console.warn(`Dispute on ${e.milestoneId}: ${e.disputeReason}`);
      break;
  }
}
```

## Compatibility

- Topics match the Rust enum variants in `contracts/treasury-escrow`. Keep them
  in sync when changing the contract.
- Adding a new event type is additive: add the variant to `EscrowEventType`,
  the interface, and a `case` in `parseEscrowEvent`. Existing consumers keep
  working.
- The web escrow page (`apps/web/app/escrow/page.tsx`) renders mapped events
  from `examples/escrow-events-example.json` as a live demo.
