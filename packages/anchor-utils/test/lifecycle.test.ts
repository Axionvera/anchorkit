/**
 * Anchor lifecycle state-machine tests (issue #5).
 * Validates every legal transition and rejects illegal ones, plus helper
 * utilities (terminal detection, sequence audit, next-status).
 */

import { describe, it, expect } from "vitest";
import {
  ALLOWED_TRANSITIONS,
  TERMINAL_STATUSES,
  isTransitionValid,
  isTerminalStatus,
  transition,
  nextStatus,
  findFirstIllegalTransition,
  lifecycleStepLabel,
} from "../src/lifecycle";

describe("isTransitionValid", () => {
  it("allows the happy path", () => {
    expect(isTransitionValid("pending_user", "pending_anchor")).toBe(true);
    expect(isTransitionValid("pending_anchor", "pending_stellar")).toBe(true);
    expect(isTransitionValid("pending_stellar", "completed")).toBe(true);
  });

  it("allows failure/refund branches from in-flight states", () => {
    expect(isTransitionValid("pending_anchor", "failed")).toBe(true);
    expect(isTransitionValid("pending_anchor", "refunded")).toBe(true);
    expect(isTransitionValid("pending_stellar", "failed")).toBe(true);
    expect(isTransitionValid("pending_stellar", "refunded")).toBe(true);
  });

  it("rejects skipping steps (pending_user -> completed)", () => {
    expect(isTransitionValid("pending_user", "completed")).toBe(false);
  });

  it("rejects moving out of terminal states", () => {
    expect(isTransitionValid("completed", "failed")).toBe(false);
    expect(isTransitionValid("failed", "completed")).toBe(false);
    expect(isTransitionValid("refunded", "pending_user")).toBe(false);
  });

  it("allows staying in the same status", () => {
    expect(isTransitionValid("pending_anchor", "pending_anchor")).toBe(true);
  });
});

describe("transition()", () => {
  it("returns ok + status on a legal move", () => {
    const r = transition("pending_user", "pending_anchor");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.status).toBe("pending_anchor");
  });

  it("returns ok on terminal override", () => {
    const r = transition("pending_stellar", "failed");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.status).toBe("failed");
  });

  it("returns ok:false with an error message on an illegal move", () => {
    const r = transition("pending_user", "completed");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toContain("Illegal transition");
      expect(r.error).toContain("pending_user");
      expect(r.error).toContain("completed");
    }
  });

  it("rejects transitions out of terminal states", () => {
    const r = transition("completed", "refunded");
    expect(r.ok).toBe(false);
  });
});

describe("terminal + next-status helpers", () => {
  it("identifies terminal statuses", () => {
    for (const s of TERMINAL_STATUSES) expect(isTerminalStatus(s)).toBe(true);
    expect(isTerminalStatus("pending_user")).toBe(false);
  });

  it("nextStatus follows the happy path", () => {
    expect(nextStatus("pending_user")).toBe("pending_anchor");
    expect(nextStatus("pending_anchor")).toBe("pending_stellar");
    expect(nextStatus("pending_stellar")).toBe("completed");
  });

  it("nextStatus returns null for terminal / dead-end states", () => {
    expect(nextStatus("completed")).toBeNull();
    expect(nextStatus("failed")).toBeNull();
  });

  it("nextStatus honors terminal override", () => {
    expect(nextStatus("pending_anchor", "failed")).toBe("failed");
  });
});

describe("sequence audit", () => {
  it("accepts a fully valid timeline", () => {
    const steps = [
      "pending_user",
      "pending_anchor",
      "pending_stellar",
      "completed",
    ] as const;
    expect(findFirstIllegalTransition(steps)).toBeNull();
  });

  it("flags the first illegal step", () => {
    const steps = [
      "pending_user",
      "completed",
    ] as const;
    const bad = findFirstIllegalTransition(steps);
    expect(bad).not.toBeNull();
    if (bad) {
      expect(bad.index).toBe(1);
      expect(bad.from).toBe("pending_user");
      expect(bad.to).toBe("completed");
    }
  });
});

describe("lifecycleStepLabel", () => {
  it("labels deposit vs withdrawal steps", () => {
    expect(lifecycleStepLabel("pending_user", "deposit")).toContain("Deposit");
    expect(lifecycleStepLabel("pending_stellar", "withdrawal")).toContain(
      "Withdrawal"
    );
    expect(lifecycleStepLabel("completed", "deposit")).toContain("completed");
  });
});
