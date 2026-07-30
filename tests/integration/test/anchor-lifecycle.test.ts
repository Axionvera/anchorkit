import {
  advanceAnchorTransactionStatus,
  anchorStatusToUserMessage,
  findFirstIllegalTransition,
  isTerminalStatus,
  transition,
} from "@anchorkit/anchor-utils";
import {
  anchorRecordToReceipt,
  getAnchorSeverity,
  mapAnchorStatusToReceiptStatus,
} from "@anchorkit/stellar-kit";
import { isAnchorKitError, mapErrorToUserSafeMessage } from "@anchorkit/types";
import { AnchorTransactionRecordSchema, TransactionReceiptSchema } from "@anchorkit/validators";
import {
  buildDepositLifecycle,
  buildWithdrawalLifecycle,
  DEPOSIT_STATUS_SEQUENCE,
  WITHDRAWAL_STATUS_SEQUENCE,
} from "./fixtures";

describe("anchor lifecycle mapping", () => {
  it("validates and maps every deposit lifecycle snapshot through public APIs", () => {
    const records = buildDepositLifecycle().map((record) =>
      AnchorTransactionRecordSchema.parse(record)
    );

    expect(records.map(({ status }) => status)).toEqual(DEPOSIT_STATUS_SEQUENCE);
    expect(findFirstIllegalTransition(records.map(({ status }) => status))).toBeNull();

    for (const [index, record] of records.entries()) {
      const message = anchorStatusToUserMessage(record.status, record.kind);
      const receipt = anchorRecordToReceipt(record);

      expect(message.severity).toBe(getAnchorSeverity(record.status).level);
      expect(TransactionReceiptSchema.parse(receipt).status).toBe(
        mapAnchorStatusToReceiptStatus(record.status)
      );

      const next = records[index + 1];
      if (next) {
        expect(advanceAnchorTransactionStatus(record.status)).toBe(next.status);
      }
    }
  });

  it("treats withdrawal fixtures as status snapshots, not a legal transition path", () => {
    const records = buildWithdrawalLifecycle().map((record) =>
      AnchorTransactionRecordSchema.parse(record)
    );

    expect(records.map(({ status }) => status)).toEqual(WITHDRAWAL_STATUS_SEQUENCE);
    expect(anchorRecordToReceipt(records[3]!).status).toBe("failed");
    expect(anchorRecordToReceipt(records[4]!).status).toBe("rejected");
    expect(records[4]!.refunded).toBe(true);

    // Shared fixture emits pending_user → pending_stellar, which the lifecycle
    // state machine rejects. Keep that contract explicit so the suites cannot drift.
    expect(findFirstIllegalTransition(WITHDRAWAL_STATUS_SEQUENCE)).toEqual({
      from: "pending_user",
      to: "pending_stellar",
      index: 1,
    });
  });

  it("rejects illegal terminal transitions through the lifecycle state machine", () => {
    const result = transition("completed", "refunded");

    expect(result.ok).toBe(false);
    expect(isTerminalStatus("completed")).toBe(true);
    expect(isAnchorKitError(result.anchorKitError)).toBe(true);
    expect(result.anchorKitError).toMatchObject({
      category: "ANCHOR",
      code: "ILLEGAL_LIFECYCLE_TRANSITION",
      details: { from: "completed", to: "refunded" },
    });
    expect(mapErrorToUserSafeMessage(result.anchorKitError!).title).toBe("Anchor Service Error");
  });

  it("rejects malformed lifecycle records before mapping", () => {
    const malformed = {
      ...buildDepositLifecycle()[0],
      amountIn: "-1",
      updatedAt: "not-an-iso-timestamp",
    };

    expect(AnchorTransactionRecordSchema.safeParse(malformed).success).toBe(false);
  });
});
