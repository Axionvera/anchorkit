"use client";

import { useMemo, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { Alert, Button, Card, DataRow, Input, Label, MilestoneStatusBadge } from "@/components/ui";
import { EvidenceHashDisplay } from "@/components/EvidenceHashDisplay";
import { MilestoneActionPanel } from "@/components/MilestoneActionPanel";
import { parseEscrowEvents, escrowReleaseToReceipt, escrowMilestoneToSummary } from "@anchorkit/stellar-kit";
import { escrowEventExample } from "@/lib/escrowEventExample";
import { TransactionReceiptPanel } from "@/components/TransactionReceiptPanel";
import { TransactionSummaryPanel } from "@/components/TransactionSummaryPanel";
import { getMilestoneUiInfo } from "@anchorkit/types";
import type {
  EscrowEventV1,
  EscrowSummary,
  Milestone,
  MilestoneStatus,
  MilestoneAction,
} from "@anchorkit/types";

const FRIENDBOT = "GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR";
const DEMO_RECIPIENT = "GDQJUTQYK2MQ32ZGMMB7Q3UKTJLNTMZI2QYHW7OK2TK2DZI3X5IGQH6U";
const LIFECYCLE: MilestoneStatus[] = [
  "draft",
  "active",
  "evidence_submitted",
  "approved",
  "disputed",
  "ready_for_release",
  "released",
];

const sampleEvidence = "5feceb66ffc86f38d952786c6d696c79c2dbc239dd4e91b46729d73a27fb57e9";

export default function EscrowPage() {
  const [title, setTitle] = useState("Milestone 1: Initial deliverables");
  const [amount, setAmount] = useState("15000.0000000");
  const [step, setStep] = useState(0);
  const [disputeReason, setDisputeReason] = useState("Evidence insufficient.");

  const now = new Date().toISOString();

  const mappedEvents = useMemo(() => parseEscrowEvents(escrowEventExample).events, []);

  const releaseReceipt = useMemo(() => {
    const released = mappedEvents.find((e) => e.type === "released");
    return released ? escrowReleaseToReceipt(released, "testnet") : null;
  }, [mappedEvents]);

  const demoMilestone: Milestone = useMemo(() => {
    const status = LIFECYCLE[step] ?? "draft";
    return {
      id: "1",
      title,
      description: "Mock milestone data — no Soroban deployment required for the MVP UI.",
      amount,
      status,
      evidenceHash: step >= 2 ? sampleEvidence : undefined,
      createdAt: now,
      updatedAt: now,
      approvedAt:
        status === "approved" || status === "ready_for_release" || status === "released"
          ? now
          : undefined,
      releasedAt: status === "released" ? now : undefined,
      disputedAt: status === "disputed" ? now : undefined,
      disputeReason: status === "disputed" ? disputeReason : undefined,
    } as Milestone;
  }, [step, title, amount, disputeReason, now]);

  const milestoneUi = useMemo(() => getMilestoneUiInfo(demoMilestone, true), [demoMilestone]);

  const releaseSummary = useMemo(
    () =>
      escrowMilestoneToSummary({
        milestone: demoMilestone,
        adminPublicKey: FRIENDBOT,
        destinationPublicKey: DEMO_RECIPIENT,
        riskNotes: [
          {
            code: "ESCROW_MOCK_ONLY",
            message: "Escrow release is simulated in the MVP dashboard; no on-chain transfer runs here.",
            severity: "warning",
          },
        ],
      }),
    [demoMilestone]
  );

  const summary: EscrowSummary = useMemo(
    () => ({
      admin: FRIENDBOT,
      totalMilestones: 5,
      totalAmount: "75000.0000000",
      releasedAmount: step >= 6 ? amount : "30000.0000000",
      pendingAmount: "45000.0000000",
      disputedCount: step === 4 ? 1 : 0,
      completedCount: step >= 6 ? 2 : 1,
    }),
    [step, amount]
  );

  const handleAction = (action: MilestoneAction) => {
    const status = LIFECYCLE[step];
    if (!status) return;
    const idx = LIFECYCLE.indexOf(status);
    const transitions: Partial<Record<MilestoneStatus, MilestoneStatus>> = {
      draft: "active",
      active: "evidence_submitted",
      evidence_submitted: action === "approve" ? "approved" : "disputed",
      approved: "ready_for_release",
      ready_for_release: "released",
    };
    const next = transitions[status];
    if (next) {
      const nextIdx = LIFECYCLE.indexOf(next);
      if (nextIdx >= 0) setStep(nextIdx);
    }
  };

  return (
    <PageShell
      eyebrow="Escrow"
      title="Soroban treasury escrow example"
      subtitle="Explore the milestone lifecycle implemented by the Rust Soroban contract in contracts/treasury-escrow. Evidence, approval, dispute, release gates, and the admin-only authorization model are all first-class in the on-chain contract."
      warning="The MVP Escrow page runs as a UI mock against a local state step. The actual contract logic lives in the Cargo crate under contracts/treasury-escrow with Rust tests. Deploy the .wasm to testnet via Soroban CLI for live integration."
    >
      <Card>
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-3 lg:col-span-2">
            <h2 className="text-base font-semibold tracking-tight">Milestone composer</h2>
            <div>
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label>Amount</Label>
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <Label>Dispute reason (used when reaching disputed state)</Label>
              <Input value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              {LIFECYCLE.map((s, idx) => (
                <button
                  key={s}
                  onClick={() => setStep(idx)}
                  className={`rounded-md border px-3 py-1.5 text-sm ${
                    step === idx
                      ? "border-stellar-500 bg-stellar-50 text-stellar-700 dark:bg-stellar-950/40 dark:text-stellar-300"
                      : "border-ink-300 dark:border-ink-700"
                  }`}
                >
                  {idx + 1}. {s.replaceAll("_", " ")}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep((s) => Math.max(0, s - 1))}>
                &larr; Back
              </Button>
              <Button
                variant="primary"
                onClick={() => setStep((s) => Math.min(LIFECYCLE.length - 1, s + 1))}
              >
                Advance step &rarr;
              </Button>
            </div>
          </div>

          <div className="lg:col-span-3">
            <h2 className="text-base font-semibold tracking-tight">Milestone snapshot</h2>
            <div className="mt-3 rounded-lg border border-ink-200 p-4 text-sm dark:border-ink-800">
              <dl className="divide-y divide-ink-100 dark:divide-ink-800">
                <DataRow
                  label="Status"
                  value={<MilestoneStatusBadge status={demoMilestone.status} />}
                />
                <DataRow label="Title" value={demoMilestone.title} />
                <DataRow
                  label="Amount"
                  value={<span className="text-mono-sm">{demoMilestone.amount} XLM</span>}
                />
                <DataRow
                  label="Evidence hash"
                  value={<EvidenceHashDisplay milestone={demoMilestone} />}
                />
                <DataRow
                  label="Approved at"
                  value={
                    demoMilestone.approvedAt ? (
                      <span className="text-mono-xs">{demoMilestone.approvedAt}</span>
                    ) : (
                      <span className="text-ink-500">&mdash;</span>
                    )
                  }
                />
                <DataRow
                  label="Released at"
                  value={
                    demoMilestone.releasedAt ? (
                      <span className="text-mono-xs">{demoMilestone.releasedAt}</span>
                    ) : (
                      <span className="text-ink-500">&mdash;</span>
                    )
                  }
                />
                <DataRow
                  label="Dispute reason"
                  value={
                    demoMilestone.disputeReason ?? (
                      <span className="text-ink-500 dark:text-ink-400">No dispute</span>
                    )
                  }
                />
              </dl>
            </div>

            <div className="mt-4">
              <MilestoneActionPanel uiInfo={milestoneUi} isAdmin={true} onAction={handleAction} />
            </div>
            <div className="mt-4">
              <TransactionSummaryPanel
                summary={releaseSummary}
                title="Escrow release review summary"
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-base font-semibold tracking-tight">Escrow summary</h2>
          <div className="mt-3 rounded-lg border border-ink-200 p-4 text-sm dark:border-ink-800">
            <dl className="divide-y divide-ink-100 dark:divide-ink-800">
              <DataRow
                label="Admin"
                value={<span className="text-mono-sm hash-clip">{summary.admin}</span>}
              />
              <DataRow label="Total milestones" value={summary.totalMilestones} />
              <DataRow
                label="Total amount"
                value={<span className="text-mono-sm">{summary.totalAmount}</span>}
              />
              <DataRow
                label="Released amount"
                value={
                  <span className="text-mono-sm text-green-700 dark:text-green-300">
                    {summary.releasedAmount}
                  </span>
                }
              />
              <DataRow
                label="Pending amount"
                value={
                  <span className="text-mono-sm text-amber-700 dark:text-amber-300">
                    {summary.pendingAmount}
                  </span>
                }
              />
              <DataRow label="Disputed count" value={summary.disputedCount} />
              <DataRow label="Completed count" value={summary.completedCount} />
            </dl>
          </div>
        </Card>

        <TransactionReceiptPanel receipt={releaseReceipt} title="Escrow release receipt" />

        <Card>
          <h2 className="text-base font-semibold tracking-tight">Contract quick-links</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="rounded-md border border-ink-200 p-3 dark:border-ink-800">
              <div className="font-medium">Soroban contract source</div>
              <div className="text-mono-xs text-ink-500">contracts/treasury-escrow/src/lib.rs</div>
            </li>
            <li className="rounded-md border border-ink-200 p-3 dark:border-ink-800">
              <div className="font-medium">
                Rust tests (status transitions, auth, duplicate release)
              </div>
              <div className="text-mono-xs text-ink-500">contracts/treasury-escrow/src/test.rs</div>
            </li>
            <li className="rounded-md border border-ink-200 p-3 dark:border-ink-800">
              <div className="font-medium">Contract docs</div>
              <div className="text-mono-xs text-ink-500">docs/SOROBAN_ESCROW_CONTRACT.md</div>
            </li>
            <li className="rounded-md border border-ink-200 p-3 dark:border-ink-800">
              <div className="font-medium">Milestone UI state model</div>
              <div className="text-mono-xs text-ink-500">docs/MILESTONE_UI_STATE.md</div>
            </li>
            <li className="rounded-md border border-ink-200 p-3 dark:border-ink-800">
              <div className="font-medium">Test run command</div>
              <div className="text-mono-xs text-ink-500">
                <code>pnpm contract:test</code> (cargo test under the hood)
              </div>
            </li>
          </ul>
        </Card>
      </div>

      <Card>
        <h2 className="text-base font-semibold tracking-tight">Mapped escrow events</h2>
        <p className="mb-3 text-sm text-ink-500">
          Raw Soroban events from{" "}
          <span className="text-mono-xs">examples/escrow-events-example.json</span> decoded by{" "}
          <span className="text-mono-xs">parseEscrowEvents</span> from{" "}
          <span className="text-mono-xs">@anchorkit/stellar-kit</span>. This is the client-side
          bridge between contract emissions and the UI.
        </p>
        <EscrowEventLog events={mappedEvents} />
      </Card>
    </PageShell>
  );
}

function eventSummary(e: EscrowEventV1): string {
  switch (e.type) {
    case "milestone_created":
      return `Milestone "${e.title}" created for ${e.amount} XLM`;
    case "evidence_submitted":
      return `Evidence submitted (${e.evidenceHash.slice(0, 10)}\u2026)`;
    case "approved":
      return "Milestone approved";
    case "disputed":
      return `Disputed: ${e.disputeReason}`;
    case "ready_for_release":
      return `Marked ready for release (${e.amount} XLM)`;
    case "released":
      return `Released ${e.amount} XLM`;
  }
}

function EscrowEventLog({ events }: { events: EscrowEventV1[] }) {
  if (events.length === 0) {
    return (
      <div className="rounded-md border border-ink-200 p-3 text-sm text-ink-500 dark:border-ink-800">
        No events parsed.
      </div>
    );
  }
  return (
    <ol className="space-y-2">
      {events.map((e, idx) => (
        <li
          key={`${e.type}-${e.milestoneId}-${idx}`}
          className="rounded-md border border-ink-200 p-3 text-sm dark:border-ink-800"
        >
          <div className="flex items-center justify-between">
            <span className="font-medium text-stellar-700 dark:text-stellar-300">
              {e.type.replaceAll("_", " ")}
            </span>
            <span className="text-mono-xs text-ink-500">milestone {e.milestoneId}</span>
          </div>
          <div className="mt-1 text-ink-600 dark:text-ink-300">{eventSummary(e)}</div>
          <div className="mt-1 text-mono-xs text-ink-400">
            {e.timestamp} &middot; {e.caller.slice(0, 6)}&hellip; &middot; contract{" "}
            {e.contractId.slice(0, 6)}&hellip;
          </div>
        </li>
      ))}
    </ol>
  );
}
