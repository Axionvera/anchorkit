/**
 * Escrow event mapper tests (issue #8).
 * Verifies the client mapper decodes every event type and fails safely on
 * malformed input.
 */

import { describe, it, expect } from 'vitest';
import { parseEscrowEvent, parseEscrowEvents } from '../src/escrowEvents';
import {
  milestoneCreatedRaw,
  evidenceSubmittedRaw,
  approvedRaw,
  disputedRaw,
  readyForReleaseRaw,
  releasedRaw,
  allRaw,
  CONTRACT,
} from './fixtures/escrowEvents';

describe('parseEscrowEvent — success paths', () => {
  it('decodes milestone_created', () => {
    const r = parseEscrowEvent(milestoneCreatedRaw);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.event.type).toBe('milestone_created');
      expect(r.event.milestoneId).toBe('1');
      expect(r.event.title).toBe('Milestone 1 — Design & wireframes');
      expect(r.event.amount).toBe('5000.0000000');
      expect(r.event.contractId).toBe(CONTRACT);
    }
  });

  it('decodes evidence_submitted', () => {
    const r = parseEscrowEvent(evidenceSubmittedRaw);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.event.type).toBe('evidence_submitted');
      expect(r.event.evidenceHash).toMatch(/^5fec/);
      expect(r.event.note).toBe('Audit attached.');
    }
  });

  it('decodes approved', () => {
    const r = parseEscrowEvent(approvedRaw);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.event.type).toBe('approved');
  });

  it('decodes disputed with reason', () => {
    const r = parseEscrowEvent(disputedRaw);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.event.type).toBe('disputed');
      expect(r.event.disputeReason).toContain('accessibility');
    }
  });

  it('decodes ready_for_release', () => {
    const r = parseEscrowEvent(readyForReleaseRaw);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.event.type).toBe('ready_for_release');
      expect(r.event.amount).toBe('5000.0000000');
    }
  });

  it('decodes released with transactionHash', () => {
    const r = parseEscrowEvent(releasedRaw);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.event.type).toBe('released');
      expect(r.event.transactionHash).toBeTruthy();
    }
  });
});

describe('parseEscrowEvent — topic shape variants', () => {
  it('reads the discriminator from an ScVal-like object topic', () => {
    const r = parseEscrowEvent({
      ...approvedRaw,
      topic: [{ symbol: 'approved' }, '1'],
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.event.type).toBe('approved');
  });

  it('falls back to topic[1] for milestoneId when data lacks it', () => {
    const r = parseEscrowEvent({
      contractId: CONTRACT,
      topic: ['approved', '7'],
      data: { admin: 'GADMIN' },
      timestamp: '2026-01-01T00:00:00.000Z',
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.event.milestoneId).toBe('7');
  });
});

describe('parseEscrowEvent — failure paths', () => {
  it('returns ok:false when there is no topic discriminator', () => {
    const r = parseEscrowEvent({ contractId: CONTRACT, topic: [], data: {} });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/no topic/i);
  });

  it('returns ok:false for an unknown event topic', () => {
    const r = parseEscrowEvent({
      contractId: CONTRACT,
      topic: ['frobnicated'],
      data: {},
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/unknown/i);
  });

  it('returns ok:false when a required field is missing', () => {
    const r = parseEscrowEvent({
      contractId: CONTRACT,
      topic: ['evidence_submitted', '1'],
      data: {}, // no evidenceHash
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/evidenceHash/i);
  });
});

describe('parseEscrowEvents — batch', () => {
  it('decodes all valid events and reports no failures', () => {
    const { events, failures } = parseEscrowEvents(allRaw);
    expect(events).toHaveLength(6);
    expect(failures).toHaveLength(0);
    expect(events.map((e) => e.type)).toEqual([
      'milestone_created',
      'evidence_submitted',
      'approved',
      'disputed',
      'ready_for_release',
      'released',
    ]);
  });

  it('separates failures from successes in a mixed batch', () => {
    const bad = { contractId: CONTRACT, topic: ['nope'], data: {} };
    const { events, failures } = parseEscrowEvents([milestoneCreatedRaw, bad as any]);
    expect(events).toHaveLength(1);
    expect(failures).toHaveLength(1);
  });
});
