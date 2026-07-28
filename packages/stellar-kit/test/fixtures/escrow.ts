/**
 * Shared escrow milestone lifecycle fixtures for tests.
 *
 * Covers every milestone status in the DAG:
 *   draft → active → evidence_submitted → approved → ready_for_release → released
 *   with a disputed branch
 *
 * No real contract interactions — pure data fixtures.
 */
import type { Milestone, MilestoneStatus } from "@anchorkit/types";

const EVIDENCE_HASH = "5feceb66ffc86f38d952786c6d696c79c2dbc239dd4e91b46729d73a27fb57e9";
const DISPUTE_HASH = "0000000000000000000000000000000000000000000000000000000000000001";

// ─── Individual milestone fixtures per status ───────────────────────────────

export const ESCROW_MILESTONE_DRAFT: Milestone = {
  id: "1",
  title: "Milestone 1 — Design & wireframes",
  description: "Kickoff architecture and Figma wireframes.",
  amount: "5000.0000000",
  status: "draft",
  createdAt: "2026-01-15T00:00:00.000Z",
  updatedAt: "2026-01-15T00:00:00.000Z",
};

export const ESCROW_MILESTONE_ACTIVE: Milestone = {
  id: "1",
  title: "Milestone 1 — Design & wireframes",
  description: "Kickoff architecture and Figma wireframes.",
  amount: "5000.0000000",
  status: "active",
  createdAt: "2026-01-15T00:00:00.000Z",
  updatedAt: "2026-01-16T10:00:00.000Z",
};

export const ESCROW_MILESTONE_EVIDENCE: Milestone = {
  id: "1",
  title: "Milestone 1 — Design & wireframes",
  description: "Kickoff architecture and Figma wireframes.",
  amount: "5000.0000000",
  status: "evidence_submitted",
  evidenceHash: EVIDENCE_HASH,
  createdAt: "2026-01-15T00:00:00.000Z",
  updatedAt: "2026-01-20T15:30:00.000Z",
};

export const ESCROW_MILESTONE_APPROVED: Milestone = {
  id: "1",
  title: "Milestone 1 — Design & wireframes",
  description: "Kickoff architecture and Figma wireframes.",
  amount: "5000.0000000",
  status: "approved",
  evidenceHash: EVIDENCE_HASH,
  createdAt: "2026-01-15T00:00:00.000Z",
  updatedAt: "2026-01-21T09:00:00.000Z",
  approvedAt: "2026-01-21T09:00:00.000Z",
};

export const ESCROW_MILESTONE_DISPUTED: Milestone = {
  id: "2",
  title: "Milestone 2 — Accessibility audit",
  description: "Full WCAG 2.1 AA compliance audit.",
  amount: "3000.0000000",
  status: "disputed",
  evidenceHash: DISPUTE_HASH,
  createdAt: "2026-01-20T00:00:00.000Z",
  updatedAt: "2026-02-02T12:00:00.000Z",
  disputedAt: "2026-02-02T12:00:00.000Z",
  disputeReason: "Evidence did not include the required accessibility audit.",
};

export const ESCROW_MILESTONE_READY: Milestone = {
  id: "1",
  title: "Milestone 1 — Design & wireframes",
  description: "Kickoff architecture and Figma wireframes.",
  amount: "5000.0000000",
  status: "ready_for_release",
  evidenceHash: EVIDENCE_HASH,
  createdAt: "2026-01-15T00:00:00.000Z",
  updatedAt: "2026-01-22T14:00:00.000Z",
  approvedAt: "2026-01-21T09:00:00.000Z",
};

export const ESCROW_MILESTONE_RELEASED: Milestone = {
  id: "1",
  title: "Milestone 1 — Design & wireframes",
  description: "Kickoff architecture and Figma wireframes.",
  amount: "5000.0000000",
  status: "released",
  evidenceHash: EVIDENCE_HASH,
  createdAt: "2026-01-15T00:00:00.000Z",
  updatedAt: "2026-01-23T10:00:00.000Z",
  approvedAt: "2026-01-21T09:00:00.000Z",
  releasedAt: "2026-01-23T10:00:00.000Z",
};

// ─── Lifecycle sequences ────────────────────────────────────────────────────

/** Happy path: draft → active → evidence → approved → ready → released */
export const ESCROW_MILESTONES_HAPPY_PATH: Milestone[] = [
  ESCROW_MILESTONE_DRAFT,
  ESCROW_MILESTONE_ACTIVE,
  ESCROW_MILESTONE_EVIDENCE,
  ESCROW_MILESTONE_APPROVED,
  ESCROW_MILESTONE_READY,
  ESCROW_MILESTONE_RELEASED,
];

/** With dispute: milestone 2 goes to disputed state */
export const ESCROW_MILESTONES_WITH_DISPUTE: Milestone[] = [
  ESCROW_MILESTONE_APPROVED, // ms 1
  ESCROW_MILESTONE_DISPUTED, // ms 2
];

/** Full lifecycle: both milestones across all statuses */
export const ESCROW_MILESTONES_FULL_LIFECYCLE: Milestone[] = [
  ESCROW_MILESTONE_DRAFT,
  ESCROW_MILESTONE_ACTIVE,
  ESCROW_MILESTONE_EVIDENCE,
  ESCROW_MILESTONE_APPROVED,
  ESCROW_MILESTONE_READY,
  ESCROW_MILESTONE_RELEASED,
  ESCROW_MILESTONE_DISPUTED,
];

// ─── Array for schema validation ────────────────────────────────────────────

export const ESCROW_MILESTONES_ARRAY = ESCROW_MILESTONES_FULL_LIFECYCLE;
