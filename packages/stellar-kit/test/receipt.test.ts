import { describe, it, expect } from "vitest";
import type {
  AnchorTransactionRecord,
  ReleasedEvent,
  StellarPublicKey,
  StellarTransactionHash,
  TransactionReceiptStatus,
} from "@anchorkit/types";
import {
  anchorRecordToReceipt,
  attachExplorerLink,
  buildReceiptStatusFixtures,
  buildTransactionReceipt,
  createMockTransactionReceipt,
  escrowReleaseToReceipt,
  isTransactionReceiptStatus,
  isTransactionReceiptValid,
  mapAnchorStatusToReceiptStatus,
  parseTransactionReceipt,
  receiptStatusBadge,
  receiptStatusToUserMessage,
} from "../src/receipt";

const TX_HASH = "b".repeat(64) as StellarTransactionHash;
const ACCOUNT =
  "GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR" as StellarPublicKey;

describe("receiptStatusToUserMessage", () => {
  const statuses: TransactionReceiptStatus[] = [
    "confirmed",
    "pending",
    "failed",
    "rejected",
    "unknown",
  ];

  it.each(statuses)("returns a message for %s", (status) => {
    const msg = receiptStatusToUserMessage(status);
    expect(msg.headline).toBeTruthy();
    expect(msg.detail).toBeTruthy();
    expect(["info", "warning", "error", "success"]).toContain(msg.severity);
  });
});

describe("receiptStatusBadge", () => {
  it("maps confirmed to green", () => {
    expect(receiptStatusBadge("confirmed")).toEqual({ label: "Confirmed", tone: "green" });
  });

  it("maps unknown to neutral", () => {
    expect(receiptStatusBadge("unknown").tone).toBe("neutral");
  });
});

describe("mapAnchorStatusToReceiptStatus", () => {
  it("maps pending anchor states to pending", () => {
    expect(mapAnchorStatusToReceiptStatus("pending_user")).toBe("pending");
    expect(mapAnchorStatusToReceiptStatus("pending_anchor")).toBe("pending");
    expect(mapAnchorStatusToReceiptStatus("pending_stellar")).toBe("pending");
  });

  it("maps terminal anchor states", () => {
    expect(mapAnchorStatusToReceiptStatus("completed")).toBe("confirmed");
    expect(mapAnchorStatusToReceiptStatus("failed")).toBe("failed");
    expect(mapAnchorStatusToReceiptStatus("refunded")).toBe("rejected");
  });
});

describe("buildTransactionReceipt", () => {
  it("attaches a network-aware explorer link for valid hashes", () => {
    const receipt = buildTransactionReceipt({
      id: "tx_1",
      status: "confirmed",
      network: "testnet",
      source: "payment",
      transactionHash: TX_HASH,
    });
    expect(receipt.explorerUrl).toContain("/testnet/tx/");
    expect(receipt.explorerUrl).toContain(TX_HASH);
  });

  it("omits explorer link when hash is absent", () => {
    const receipt = buildTransactionReceipt({
      id: "tx_2",
      status: "pending",
      source: "payment",
    });
    expect(receipt.explorerUrl).toBeUndefined();
  });

  it("uses mainnet explorer base when requested", () => {
    const receipt = buildTransactionReceipt({
      id: "tx_3",
      status: "confirmed",
      network: "mainnet",
      source: "payment",
      transactionHash: TX_HASH,
    });
    expect(receipt.explorerUrl).toContain("/public/tx/");
  });
});

describe("attachExplorerLink", () => {
  it("refreshes the link when network changes", () => {
    const base = buildTransactionReceipt({
      id: "tx_4",
      status: "confirmed",
      network: "testnet",
      source: "payment",
      transactionHash: TX_HASH,
    });
    const mainnet = attachExplorerLink({ ...base, network: "mainnet" });
    expect(mainnet.explorerUrl).toContain("/public/tx/");
  });
});

describe("anchorRecordToReceipt", () => {
  it("maps a completed anchor record", () => {
    const record: AnchorTransactionRecord = {
      id: "anchor_1",
      kind: "deposit",
      status: "completed",
      assetCode: "USDC",
      amountIn: "100.0000000",
      stellarAccount: ACCOUNT,
      stellarTransactionId: TX_HASH,
      startedAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:05:00.000Z",
      completedAt: "2026-01-01T00:05:00.000Z",
      metadata: {},
    };
    const receipt = anchorRecordToReceipt(record, "testnet");
    expect(receipt.status).toBe("confirmed");
    expect(receipt.source).toBe("anchor");
    expect(receipt.explorerUrl).toContain(TX_HASH);
    expect(receipt.metadata?.anchorKind).toBe("deposit");
  });

  it("maps a failed anchor record", () => {
    const record: AnchorTransactionRecord = {
      id: "anchor_2",
      kind: "withdrawal",
      status: "failed",
      assetCode: "XLM",
      amountIn: "10.0000000",
      stellarAccount: ACCOUNT,
      startedAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:01:00.000Z",
      message: "Rail timeout",
      metadata: {},
    };
    const receipt = anchorRecordToReceipt(record);
    expect(receipt.status).toBe("failed");
    expect(receipt.errorCode).toBe("ANCHOR_TRANSACTION_FAILED");
  });
});

describe("escrowReleaseToReceipt", () => {
  const released: ReleasedEvent = {
    type: "released",
    milestoneId: "ms_1",
    timestamp: "2026-01-01T00:00:00.000Z",
    caller: ACCOUNT,
    contractId: "C_CONTRACT",
    amount: "500.0000000",
    transactionHash: TX_HASH,
  };

  it("maps a released event with hash to confirmed", () => {
    const receipt = escrowReleaseToReceipt(released, "testnet");
    expect(receipt.status).toBe("confirmed");
    expect(receipt.source).toBe("escrow");
    expect(receipt.explorerUrl).toContain(TX_HASH);
  });

  it("maps a released event without hash to pending", () => {
    const receipt = escrowReleaseToReceipt({ ...released, transactionHash: undefined });
    expect(receipt.status).toBe("pending");
    expect(receipt.explorerUrl).toBeUndefined();
  });

  it("returns unknown for non-release events", () => {
    const receipt = escrowReleaseToReceipt({
      type: "approved",
      milestoneId: "ms_1",
      timestamp: "2026-01-01T00:00:00.000Z",
      caller: ACCOUNT,
      contractId: "C_CONTRACT",
    });
    expect(receipt.status).toBe("unknown");
  });
});

describe("parseTransactionReceipt", () => {
  it("parses a valid receipt", () => {
    const mock = createMockTransactionReceipt({ status: "confirmed" });
    const result = parseTransactionReceipt(mock);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.explorerUrl).toBeTruthy();
    }
  });

  it("rejects invalid receipts", () => {
    expect(parseTransactionReceipt({ id: "" }).success).toBe(false);
    expect(isTransactionReceiptValid({})).toBe(false);
  });
});

describe("isTransactionReceiptStatus", () => {
  it("narrows valid status strings", () => {
    expect(isTransactionReceiptStatus("confirmed")).toBe(true);
    expect(isTransactionReceiptStatus("bogus")).toBe(false);
  });
});

describe("buildReceiptStatusFixtures", () => {
  it("returns one fixture per status", () => {
    const fixtures = buildReceiptStatusFixtures("testnet");
    expect(fixtures).toHaveLength(5);
    expect(new Set(fixtures.map((f) => f.status)).size).toBe(5);
  });
});
