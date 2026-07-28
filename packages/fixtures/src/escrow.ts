/**
 * Escrow event and milestone fixtures (issue #59).
 *
 * Ported from `packages/stellar-kit/test/fixtures/escrowEvents.ts`. Mirrors
 * `examples/escrow-events-example.json` and
 * `examples/escrow-milestone-lifecycle.json`.
 */

import type { Milestone, RawEscrowEvent } from "@anchorkit/types";
import { ESCROW_CONTRACT_ID } from "./constants";

export const ESCROW_CONTRACT = ESCROW_CONTRACT_ID;

export const milestoneCreatedRaw: RawEscrowEvent = {
  contractId: ESCROW_CONTRACT_ID,
  topic: ["milestone_created", "1"],
  data: {
    milestoneId: "1",
    title: "Milestone 1 — Design & wireframes",
    amount: "5000.0000000",
    description: "Kickoff architecture and Figma wireframes.",
    caller: "GADMINXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  },
  timestamp: "2026-01-15T00:00:00.000Z",
  ledger: 1001,
};

export const evidenceSubmittedRaw: RawEscrowEvent = {
  contractId: ESCROW_CONTRACT_ID,
  topic: ["evidence_submitted", "1"],
  data: {
    milestoneId: "1",
    evidenceHash: "5feceb66ffc86f38d952786c6d696c79c2dbc239dd4e91b46729d73a27fb57e9",
    note: "Audit attached.",
    caller: "GCONTRIBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  },
  timestamp: "2026-01-20T15:30:00.000Z",
  ledger: 1002,
};

export const approvedRaw: RawEscrowEvent = {
  contractId: ESCROW_CONTRACT_ID,
  topic: ["approved", "1"],
  data: {
    milestoneId: "1",
    evidenceHash: "5feceb66ffc86f38d952786c6d696c79c2dbc239dd4e91b46729d73a27fb57e9",
    admin: "GADMINXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  },
  timestamp: "2026-01-21T09:00:00.000Z",
  ledger: 1003,
};

export const disputedRaw: RawEscrowEvent = {
  contractId: ESCROW_CONTRACT_ID,
  topic: ["disputed", "2"],
  data: {
    milestoneId: "2",
    disputeReason: "Evidence did not include the required accessibility audit.",
    evidenceHash: "0000000000000000000000000000000000000000000000000000000000000001",
    caller: "GCONTRIBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  },
  timestamp: "2026-02-02T12:00:00.000Z",
  ledger: 1004,
};

export const readyForReleaseRaw: RawEscrowEvent = {
  contractId: ESCROW_CONTRACT_ID,
  topic: ["ready_for_release", "1"],
  data: {
    milestoneId: "1",
    amount: "5000.0000000",
    admin: "GADMINXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  },
  timestamp: "2026-01-22T14:00:00.000Z",
  ledger: 1005,
};

export const releasedRaw: RawEscrowEvent = {
  contractId: ESCROW_CONTRACT_ID,
  topic: ["released", "1"],
  data: {
    milestoneId: "1",
    amount: "5000.0000000",
    transactionHash: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f60001",
    admin: "GADMINXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  },
  timestamp: "2026-01-23T10:00:00.000Z",
  ledger: 1006,
};

/** Every escrow event fixture, in emission order — mirrors escrow-events-example.json. */
export const allEscrowEventsRaw: RawEscrowEvent[] = [
  milestoneCreatedRaw,
  evidenceSubmittedRaw,
  approvedRaw,
  disputedRaw,
  readyForReleaseRaw,
  releasedRaw,
];

/** Milestone snapshots across the full state DAG — mirrors escrow-milestone-lifecycle.json. */
export function sampleMilestoneLifecycle(): Milestone[] {
  return [
    {
      id: "1",
      title: "Milestone 1 — Design & wireframes",
      description:
        "Kickoff: high-level architecture, Figma wireframes, and contributor onboarding docs.",
      amount: "5000.0000000",
      status: "draft",
      createdAt: "2026-01-15T00:00:00.000Z",
      updatedAt: "2026-01-15T00:00:00.000Z",
    },
    {
      id: "1",
      title: "Milestone 1 — Design & wireframes",
      amount: "5000.0000000",
      status: "active",
      createdAt: "2026-01-15T00:00:00.000Z",
      updatedAt: "2026-01-16T10:00:00.000Z",
    },
    {
      id: "1",
      title: "Milestone 1 — Design & wireframes",
      amount: "5000.0000000",
      status: "evidence_submitted",
      evidenceHash: "5feceb66ffc86f38d952786c6d696c79c2dbc239dd4e91b46729d73a27fb57e9",
      createdAt: "2026-01-15T00:00:00.000Z",
      updatedAt: "2026-01-20T15:30:00.000Z",
    },
    {
      id: "1",
      title: "Milestone 1 — Design & wireframes",
      amount: "5000.0000000",
      status: "approved",
      evidenceHash: "5feceb66ffc86f38d952786c6d696c79c2dbc239dd4e91b46729d73a27fb57e9",
      approvedAt: "2026-01-21T09:00:00.000Z",
      createdAt: "2026-01-15T00:00:00.000Z",
      updatedAt: "2026-01-21T09:00:00.000Z",
    },
    {
      id: "1",
      title: "Milestone 1 — Design & wireframes",
      amount: "5000.0000000",
      status: "ready_for_release",
      evidenceHash: "5feceb66ffc86f38d952786c6d696c79c2dbc239dd4e91b46729d73a27fb57e9",
      approvedAt: "2026-01-21T09:00:00.000Z",
      createdAt: "2026-01-15T00:00:00.000Z",
      updatedAt: "2026-01-22T14:00:00.000Z",
    },
    {
      id: "1",
      title: "Milestone 1 — Design & wireframes",
      amount: "5000.0000000",
      status: "released",
      evidenceHash: "5feceb66ffc86f38d952786c6d696c79c2dbc239dd4e91b46729d73a27fb57e9",
      approvedAt: "2026-01-21T09:00:00.000Z",
      releasedAt: "2026-01-23T10:00:00.000Z",
      createdAt: "2026-01-15T00:00:00.000Z",
      updatedAt: "2026-01-23T10:00:00.000Z",
    },
    {
      id: "2",
      title: "Milestone 2 — Disputed example",
      amount: "10000.0000000",
      status: "disputed",
      evidenceHash: "0000000000000000000000000000000000000000000000000000000000000001",
      disputedAt: "2026-02-02T12:00:00.000Z",
      disputeReason: "Evidence did not include the required accessibility audit.",
      createdAt: "2026-01-25T00:00:00.000Z",
      updatedAt: "2026-02-02T12:00:00.000Z",
    },
  ];
}
