/**
 * Escrow event schema (client-facing).
 *
 * This module is the single source of truth for the structured escrow event
 * contract between the Rust Soroban `treasury-escrow` contract and frontend
 * tooling. AnchorKit emits one structured event per key milestone action:
 *
 *   - milestone_created
 *   - evidence_submitted
 *   - approved
 *   - disputed
 *   - ready_for_release
 *   - released
 *
 * Each event derives from a raw Soroban contract event. The raw event carries
 * a `topics` array (`ScVal`s) and a `data` payload. The first topic is the
 * event discriminator (see `ESCROW_EVENT_TOPICS`); the remaining topics and the
 * `data` payload are decoded into the typed `details` of `EscrowEventV1`.
 *
 * The discriminator values intentionally match the Rust enum variants emitted
 * by `contracts/treasury-escrow` so the client mapper can switch on them
 * directly. Treat these strings as a stable contract — add new variants, never
 * rename existing ones.
 */

/** Discriminator for every structured escrow event. */
export type EscrowEventType =
  | 'milestone_created'
  | 'evidence_submitted'
  | 'approved'
  | 'disputed'
  | 'ready_for_release'
  | 'released';

/**
 * Canonical topic strings emitted by the contract. The client mapper compares
 * the first raw topic (stringified) against these values.
 */
export const ESCROW_EVENT_TOPICS: Record<EscrowEventType, string> = {
  milestone_created: 'milestone_created',
  evidence_submitted: 'evidence_submitted',
  approved: 'approved',
  disputed: 'disputed',
  ready_for_release: 'ready_for_release',
  released: 'released',
};

/** Every escrow event carries these core fields (decoded from topics/data). */
export interface EscrowEventBase {
  /** Event discriminator. */
  type: EscrowEventType;
  /** Milestone the event relates to. */
  milestoneId: string;
  /** ISO-8601 timestamp (from the ledger close time when available). */
  timestamp: string;
  /** Actor that triggered the event (contract caller / admin). */
  caller: string;
  /** Contract that emitted the event. */
  contractId: string;
  /** Optional ledger sequence where the event was observed. */
  ledger?: number;
}

/** A new milestone was registered on the escrow. */
export interface MilestoneCreatedEvent extends EscrowEventBase {
  type: 'milestone_created';
  title: string;
  amount: string;
  description?: string;
}

/** Evidence (hash) was submitted against a milestone. */
export interface EvidenceSubmittedEvent extends EscrowEventBase {
  type: 'evidence_submitted';
  evidenceHash: string;
  /** Optional human note accompanying the submission. */
  note?: string;
}

/** A milestone was approved by the admin. */
export interface ApprovedEvent extends EscrowEventBase {
  type: 'approved';
  evidenceHash?: string;
}

/** A milestone was disputed. */
export interface DisputedEvent extends EscrowEventBase {
  type: 'disputed';
  disputeReason: string;
  evidenceHash?: string;
}

/** A milestone was marked ready for release (approved → ready). */
export interface ReadyForReleaseEvent extends EscrowEventBase {
  type: 'ready_for_release';
  amount: string;
}

/** Funds for a milestone were released. */
export interface ReleasedEvent extends EscrowEventBase {
  type: 'released';
  amount: string;
  /** Transaction hash of the release payment, when available. */
  transactionHash?: string;
}

/** Discriminated union of every structured escrow event (v1). */
export type EscrowEventV1 =
  | MilestoneCreatedEvent
  | EvidenceSubmittedEvent
  | ApprovedEvent
  | DisputedEvent
  | ReadyForReleaseEvent
  | ReleasedEvent;

/**
 * Raw Soroban-style contract event as observed by a client (e.g. via
 * `server.getEvents` or a wallet/explorer stream). `topic` and `data` are kept
 * loose (`unknown`) so the mapper can decode them without forcing a dependency
 * on the SDK's `ScVal` type.
 */
export interface RawEscrowEvent {
  /** Contract address that emitted the event. */
  contractId: string;
  /** Event topics. `topics[0]` is the discriminator; the rest are args. */
  topic: unknown[];
  /** Decoded event payload (already converted from ScVal to plain values). */
  data: Record<string, unknown>;
  /** ISO-8601 timestamp or ledger close time. */
  timestamp?: string;
  /** Ledger sequence, when available. */
  ledger?: number;
}

/** Result of attempting to parse a raw event. */
export type EscrowEventParseResult =
  | { ok: true; event: EscrowEventV1 }
  | { ok: false; error: string; raw: RawEscrowEvent };
