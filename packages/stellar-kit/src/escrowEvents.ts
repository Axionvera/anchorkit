/**
 * Escrow event client mapper.
 *
 * Converts raw Soroban-style contract events (`RawEscrowEvent`) emitted by the
 * `treasury-escrow` contract into the typed `EscrowEventV1` discriminated union
 * defined in `@anchorkit/types`. Frontend tooling (the web escrow page,
 * explorers, wallets) should consume the mapped events rather than parsing raw
 * topics/payloads themselves.
 *
 * The mapper is defensive: any event it cannot confidently decode returns
 * `{ ok: false, error, raw }` instead of throwing, so a single malformed event
 * never breaks a stream.
 */

import type {
  EscrowEventV1,
  EscrowEventType,
  RawEscrowEvent,
  EscrowEventParseResult,
} from '@anchorkit/types';
import {
  ESCROW_EVENT_TOPICS,
  type MilestoneCreatedEvent,
  type EvidenceSubmittedEvent,
  type ApprovedEvent,
  type DisputedEvent,
  type ReadyForReleaseEvent,
  type ReleasedEvent,
} from '@anchorkit/types';

/** Read the discriminator (first topic) as a string. */
function readTopic(raw: RawEscrowEvent): string | undefined {
  const first = raw.topic?.[0];
  if (first == null) return undefined;
  if (typeof first === 'string') return first;
  // ScVal symbol/string often serialises as { symbol: 'x' } or { value: 'x' }.
  if (typeof first === 'object') {
    const f = first as Record<string, unknown>;
    if (typeof f.symbol === 'string') return f.symbol;
    if (typeof f.value === 'string') return f.value;
    if (typeof f.scv === 'string') return f.scv;
  }
  return String(first);
}

function asString(v: unknown, fallback = ''): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'bigint') return String(v);
  return fallback;
}

/** Parse a single raw event into the typed union. */
export function parseEscrowEvent(raw: RawEscrowEvent): EscrowEventParseResult {
  const discriminator = readTopic(raw);
  const base = {
    contractId: raw.contractId,
    timestamp: raw.timestamp ?? new Date(0).toISOString(),
    ledger: raw.ledger,
  };

  if (!discriminator) {
    return { ok: false, error: 'event has no topic discriminator', raw };
  }

  let type: EscrowEventType | undefined;
  for (const key of Object.keys(ESCROW_EVENT_TOPICS) as EscrowEventType[]) {
    if (ESCROW_EVENT_TOPICS[key] === discriminator) {
      type = key;
      break;
    }
  }
  if (!type) {
    return { ok: false, error: `unknown escrow event topic: ${discriminator}`, raw };
  }

  try {
    switch (type) {
      case 'milestone_created': {
        const event: MilestoneCreatedEvent = {
          ...base,
          type,
          milestoneId: asString(raw.data.milestoneId ?? raw.topic?.[1]),
          title: asString(raw.data.title),
          amount: asString(raw.data.amount),
          description: typeof raw.data.description === 'string' ? raw.data.description : undefined,
          caller: asString(raw.data.caller ?? raw.data.admin),
        };
        if (!event.milestoneId) throw new Error('missing milestoneId');
        return { ok: true, event };
      }
      case 'evidence_submitted': {
        const event: EvidenceSubmittedEvent = {
          ...base,
          type,
          milestoneId: asString(raw.data.milestoneId ?? raw.topic?.[1]),
          evidenceHash: asString(raw.data.evidenceHash ?? raw.data.hash),
          note: typeof raw.data.note === 'string' ? raw.data.note : undefined,
          caller: asString(raw.data.caller),
        };
        if (!event.evidenceHash) throw new Error('missing evidenceHash');
        return { ok: true, event };
      }
      case 'approved': {
        const event: ApprovedEvent = {
          ...base,
          type,
          milestoneId: asString(raw.data.milestoneId ?? raw.topic?.[1]),
          evidenceHash: typeof raw.data.evidenceHash === 'string' ? raw.data.evidenceHash : undefined,
          caller: asString(raw.data.caller ?? raw.data.admin),
        };
        if (!event.milestoneId) throw new Error('missing milestoneId');
        return { ok: true, event };
      }
      case 'disputed': {
        const event: DisputedEvent = {
          ...base,
          type,
          milestoneId: asString(raw.data.milestoneId ?? raw.topic?.[1]),
          disputeReason: asString(raw.data.disputeReason ?? raw.data.reason, 'No reason provided'),
          evidenceHash: typeof raw.data.evidenceHash === 'string' ? raw.data.evidenceHash : undefined,
          caller: asString(raw.data.caller),
        };
        if (!event.milestoneId) throw new Error('missing milestoneId');
        return { ok: true, event };
      }
      case 'ready_for_release': {
        const event: ReadyForReleaseEvent = {
          ...base,
          type,
          milestoneId: asString(raw.data.milestoneId ?? raw.topic?.[1]),
          amount: asString(raw.data.amount),
          caller: asString(raw.data.caller ?? raw.data.admin),
        };
        if (!event.milestoneId) throw new Error('missing milestoneId');
        return { ok: true, event };
      }
      case 'released': {
        const event: ReleasedEvent = {
          ...base,
          type,
          milestoneId: asString(raw.data.milestoneId ?? raw.topic?.[1]),
          amount: asString(raw.data.amount),
          transactionHash: typeof raw.data.transactionHash === 'string' ? raw.data.transactionHash : undefined,
          caller: asString(raw.data.caller ?? raw.data.admin),
        };
        if (!event.milestoneId) throw new Error('missing milestoneId');
        return { ok: true, event };
      }
      default:
        return { ok: false, error: "unhandled event type", raw };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'failed to decode event';
    return { ok: false, error: message, raw };
  }
}

/** Parse a batch of raw events, returning only the successfully decoded ones. */
export function parseEscrowEvents(
  raws: RawEscrowEvent[],
): { events: EscrowEventV1[]; failures: EscrowEventParseResult[] } {
  const events: EscrowEventV1[] = [];
  const failures: EscrowEventParseResult[] = [];
  for (const raw of raws) {
    const result = parseEscrowEvent(raw);
    if (result.ok) events.push(result.event);
    else failures.push(result);
  }
  return { events, failures };
}
