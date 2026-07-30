import { getMilestoneUiInfo } from "@anchorkit/types";
import {
  escrowMilestoneToSummary,
  escrowReleaseToReceipt,
  parseEscrowEvents,
} from "@anchorkit/stellar-kit";
import {
  MilestoneSchema,
  MilestoneUiInfoSchema,
  RawEscrowEventSchema,
  TransactionReceiptSchema,
  TransactionSummarySchema,
} from "@anchorkit/validators";
import { allEscrowEventsRaw, sampleMilestoneLifecycle } from "./fixtures";

describe("escrow milestone validation", () => {
  it("validates milestone snapshots and their derived UI and review models", () => {
    const milestones = sampleMilestoneLifecycle();

    for (const fixture of milestones) {
      const milestone = MilestoneSchema.parse(fixture);
      const uiInfo = getMilestoneUiInfo(milestone, true);
      const summary = escrowMilestoneToSummary({ milestone });

      expect(MilestoneUiInfoSchema.parse(uiInfo).status).toBe(milestone.status);
      expect(TransactionSummarySchema.parse(summary)).toMatchObject({
        operation: "escrow_release",
        source: "escrow",
        amount: milestone.amount,
        metadata: {
          milestoneId: milestone.id,
          milestoneStatus: milestone.status,
        },
      });
    }
  });

  it("keeps escrow event stream and milestone snapshots consistent", () => {
    const milestones = sampleMilestoneLifecycle().map((milestone) =>
      MilestoneSchema.parse(milestone)
    );
    const parsed = parseEscrowEvents(
      allEscrowEventsRaw.map((event) => RawEscrowEventSchema.parse(event))
    );

    expect(parsed.failures).toEqual([]);

    const evidenceEvent = parsed.events.find((event) => event.type === "evidence_submitted");
    const approvedEvent = parsed.events.find((event) => event.type === "approved");
    const releasedEvent = parsed.events.find((event) => event.type === "released");
    const evidenceMilestone = milestones.find(
      (milestone) => milestone.status === "evidence_submitted"
    );
    const approvedMilestone = milestones.find((milestone) => milestone.status === "approved");
    const releasedMilestone = milestones.find((milestone) => milestone.status === "released");

    expect(evidenceEvent?.type).toBe("evidence_submitted");
    expect(approvedEvent?.type).toBe("approved");
    expect(releasedEvent?.type).toBe("released");
    if (
      evidenceEvent?.type !== "evidence_submitted" ||
      approvedEvent?.type !== "approved" ||
      releasedEvent?.type !== "released"
    ) {
      throw new Error("expected evidence/approved/released escrow events");
    }

    expect(evidenceEvent.evidenceHash).toBe(evidenceMilestone?.evidenceHash);
    expect(approvedEvent.timestamp).toBe(approvedMilestone?.approvedAt);
    expect(releasedEvent.timestamp).toBe(releasedMilestone?.releasedAt);
  });

  it("validates and maps raw escrow events into a release receipt", () => {
    const rawEvents = allEscrowEventsRaw.map((event) => RawEscrowEventSchema.parse(event));
    const parsed = parseEscrowEvents(rawEvents);

    expect(parsed.failures).toEqual([]);
    expect(parsed.events).toHaveLength(rawEvents.length);

    const released = parsed.events.find((event) => event.type === "released");
    expect(released).toBeDefined();

    const receipt = escrowReleaseToReceipt(released!);
    expect(TransactionReceiptSchema.parse(receipt)).toMatchObject({
      status: "confirmed",
      source: "escrow",
    });
  });

  it("rejects a malformed milestone before deriving downstream models", () => {
    const malformed = {
      ...sampleMilestoneLifecycle()[0],
      title: "",
      amount: "0",
    };

    expect(MilestoneSchema.safeParse(malformed).success).toBe(false);
  });
});
