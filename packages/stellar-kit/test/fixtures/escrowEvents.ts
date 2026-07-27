/** Fixture raw events covering every escrow event type (issue #8). */
import type { RawEscrowEvent } from '@anchorkit/types';

export const CONTRACT = 'CCESCROWAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAE';

export const milestoneCreatedRaw: RawEscrowEvent = {
  contractId: CONTRACT,
  topic: ['milestone_created', '1'],
  data: {
    milestoneId: '1',
    title: 'Milestone 1 — Design & wireframes',
    amount: '5000.0000000',
    description: 'Kickoff architecture and Figma wireframes.',
    caller: 'GADMINXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  },
  timestamp: '2026-01-15T00:00:00.000Z',
  ledger: 1001,
};

export const evidenceSubmittedRaw: RawEscrowEvent = {
  contractId: CONTRACT,
  topic: ['evidence_submitted', '1'],
  data: {
    milestoneId: '1',
    evidenceHash: '5feceb66ffc86f38d952786c6d696c79c2dbc239dd4e91b46729d73a27fb57e9',
    note: 'Audit attached.',
    caller: 'GCONTRIBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  },
  timestamp: '2026-01-20T15:30:00.000Z',
  ledger: 1002,
};

export const approvedRaw: RawEscrowEvent = {
  contractId: CONTRACT,
  topic: ['approved', '1'],
  data: {
    milestoneId: '1',
    evidenceHash: '5feceb66ffc86f38d952786c6d696c79c2dbc239dd4e91b46729d73a27fb57e9',
    admin: 'GADMINXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  },
  timestamp: '2026-01-21T09:00:00.000Z',
  ledger: 1003,
};

export const disputedRaw: RawEscrowEvent = {
  contractId: CONTRACT,
  topic: ['disputed', '2'],
  data: {
    milestoneId: '2',
    disputeReason: 'Evidence did not include the required accessibility audit.',
    evidenceHash: '0000000000000000000000000000000000000000000000000000000000000001',
    caller: 'GCONTRIBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  },
  timestamp: '2026-02-02T12:00:00.000Z',
  ledger: 1004,
};

export const readyForReleaseRaw: RawEscrowEvent = {
  contractId: CONTRACT,
  topic: ['ready_for_release', '1'],
  data: {
    milestoneId: '1',
    amount: '5000.0000000',
    admin: 'GADMINXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  },
  timestamp: '2026-01-22T14:00:00.000Z',
  ledger: 1005,
};

export const releasedRaw: RawEscrowEvent = {
  contractId: CONTRACT,
  topic: ['released', '1'],
  data: {
    milestoneId: '1',
    amount: '5000.0000000',
    transactionHash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f60001',
    admin: 'GADMINXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  },
  timestamp: '2026-01-23T10:00:00.000Z',
  ledger: 1006,
};

export const allRaw = [
  milestoneCreatedRaw,
  evidenceSubmittedRaw,
  approvedRaw,
  disputedRaw,
  readyForReleaseRaw,
  releasedRaw,
];
