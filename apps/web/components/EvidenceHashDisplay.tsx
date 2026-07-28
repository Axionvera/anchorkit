"use client";

import { getMilestoneEvidenceDisplay } from "@anchorkit/types";
import type { Milestone } from "@anchorkit/types";

interface EvidenceHashDisplayProps {
  milestone: Milestone;
}

/**
 * Renders a milestone's evidence hash safely.
 *
 * - Not submitted → grey placeholder text.
 * - Submitted → truncated hash with copy-to-clipboard on click.
 * - Invalid → error-styled truncated hash with copy-to-clipboard.
 */
export function EvidenceHashDisplay({ milestone }: EvidenceHashDisplayProps) {
  const evidence = getMilestoneEvidenceDisplay(milestone);

  if (evidence.state === "not_submitted") {
    return (
      <span className="text-ink-500 dark:text-ink-400">Not submitted</span>
    );
  }

  if (evidence.state === "submitted" && evidence.fullHash) {
    return (
      <span
        className="text-mono-sm hash-clip cursor-pointer text-ink-900 dark:text-ink-100"
        title={evidence.fullHash}
        onClick={() => navigator.clipboard.writeText(evidence.fullHash!)}
      >
        {evidence.truncated}
      </span>
    );
  }

  if (evidence.state === "invalid" && evidence.fullHash) {
    return (
      <span
        className="text-mono-sm cursor-pointer text-red-600 dark:text-red-400"
        title={evidence.fullHash}
        onClick={() => navigator.clipboard.writeText(evidence.fullHash!)}
      >
        {evidence.truncated}
      </span>
    );
  }

  return <span className="text-ink-500">—</span>;
}
