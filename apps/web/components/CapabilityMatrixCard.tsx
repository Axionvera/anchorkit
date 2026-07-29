"use client";

import clsx from "clsx";
import type {
  AnchorCapabilityMatrix,
  AnchorRailCapability,
  AnchorAssetCapability,
  AnchorRailCapabilityState,
} from "@anchorkit/types";
import { Card, CapabilityBadge } from "@/components/ui";

// ─── State badge ──────────────────────────────────────────────────────────────

/**
 * Renders a small pill badge for `AnchorRailCapabilityState`. Reuses the same
 * colour semantics as `CapabilityBadge` but accepts the extended rail state
 * union (which includes `"unsupported"`).
 */
function RailStateBadge({ state }: { state: AnchorRailCapabilityState }) {
  // Map the extended rail states onto the base CapabilityState where possible
  const mapped = state === "unsupported" ? "unavailable" : state;
  return <CapabilityBadge state={mapped} />;
}

// ─── Rail row ─────────────────────────────────────────────────────────────────

function RailRow({ rail }: { rail: AnchorRailCapability }) {
  return (
    <li className="flex flex-col gap-1 rounded-lg border border-ink-100 px-3 py-2 dark:border-ink-800">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-ink-800 dark:text-ink-200">{rail.name}</span>
        <RailStateBadge state={rail.state} />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-ink-500 dark:text-ink-400">
        <span>
          Deposit:{" "}
          <span
            className={clsx(
              "font-medium",
              rail.depositSupported ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
            )}
          >
            {rail.depositSupported ? "✓" : "✗"}
          </span>
        </span>
        <span>
          Withdrawal:{" "}
          <span
            className={clsx(
              "font-medium",
              rail.withdrawalSupported
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-500"
            )}
          >
            {rail.withdrawalSupported ? "✓" : "✗"}
          </span>
        </span>
        <span>Currencies: {rail.currencies.join(", ")}</span>
        <span>Countries: {rail.countries.join(", ")}</span>
      </div>
      {rail.note && (
        <p className="text-xs italic text-ink-400 dark:text-ink-500">{rail.note}</p>
      )}
    </li>
  );
}

// ─── Asset row ────────────────────────────────────────────────────────────────

function AssetRow({ asset }: { asset: AnchorAssetCapability }) {
  return (
    <li className="flex flex-col gap-1 rounded-lg border border-ink-100 px-3 py-2 dark:border-ink-800">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-ink-800 dark:text-ink-200">{asset.code}</span>
        <span
          className={clsx(
            "rounded-full border px-2 py-0.5 text-mono-xs font-medium",
            asset.enabled
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              : "border-ink-200 bg-ink-50 text-ink-500 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-400"
          )}
        >
          {asset.enabled ? "enabled" : "disabled"}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-ink-500 dark:text-ink-400">
        <span>
          Deposit:{" "}
          <span
            className={clsx(
              "font-medium",
              asset.depositEnabled ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
            )}
          >
            {asset.depositEnabled ? "✓" : "✗"}
          </span>
        </span>
        <span>
          Withdrawal:{" "}
          <span
            className={clsx(
              "font-medium",
              asset.withdrawalEnabled
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-500"
            )}
          >
            {asset.withdrawalEnabled ? "✓" : "✗"}
          </span>
        </span>
        {asset.feeFixed && <span>Fee (fixed): {asset.feeFixed}</span>}
        {asset.feePercent && <span>Fee (%): {asset.feePercent}%</span>}
      </div>
      {asset.note && (
        <p className="text-xs italic text-ink-400 dark:text-ink-500">{asset.note}</p>
      )}
    </li>
  );
}

// ─── Behaviours section ────────────────────────────────────────────────────────

function BehavioursSection({
  title,
  behaviours,
  tone,
}: {
  title: string;
  behaviours: Record<string, string>;
  tone: "amber" | "red";
}) {
  const entries = Object.entries(behaviours);
  if (entries.length === 0) return null;

  const classes =
    tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
      : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300";

  return (
    <div className={clsx("rounded-lg border px-3 py-2 text-xs", classes)}>
      <p className="mb-1 font-semibold">{title}</p>
      <ul className="space-y-0.5">
        {entries.map(([key, desc]) => (
          <li key={key}>
            <span className="font-mono opacity-70">{key}:</span> {desc}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

/**
 * Renders the full anchor capability matrix as a dashboard card. Displays the
 * overall anchor state, all rail capabilities, all asset capabilities, and any
 * experimental/disabled behaviour notes.
 *
 * Used on the Anchors page to give contributors a single-glance view of what
 * the anchor integration supports.
 */
export function CapabilityMatrixCard({
  matrix,
}: {
  matrix: AnchorCapabilityMatrix;
}) {
  return (
    <Card className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight">{matrix.anchorName}</h3>
          {matrix.isMock && (
            <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
              Mock anchor — no real transactions are submitted
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 pt-0.5">
          <RailStateBadge state={matrix.overallState} />
        </div>
      </div>

      {/* Flow states */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-ink-500 dark:text-ink-400">Deposit flow:</span>
          <RailStateBadge state={matrix.depositState} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-ink-500 dark:text-ink-400">Withdrawal flow:</span>
          <RailStateBadge state={matrix.withdrawalState} />
        </div>
      </div>

      {/* Payment rails */}
      <section>
        <h4 className="mb-2 text-sm font-semibold text-ink-700 dark:text-ink-300">
          Payment rails ({matrix.rails.length})
        </h4>
        <ul className="space-y-2">
          {matrix.rails.map((rail) => (
            <RailRow key={rail.railId} rail={rail} />
          ))}
        </ul>
      </section>

      {/* Supported assets */}
      <section>
        <h4 className="mb-2 text-sm font-semibold text-ink-700 dark:text-ink-300">
          Supported assets ({matrix.assets.length})
        </h4>
        <ul className="space-y-2">
          {matrix.assets.map((asset) => (
            <AssetRow key={asset.code} asset={asset} />
          ))}
        </ul>
      </section>

      {/* Experimental behaviours */}
      {matrix.experimentalBehaviours &&
        Object.keys(matrix.experimentalBehaviours).length > 0 && (
          <BehavioursSection
            title="Experimental behaviours"
            behaviours={matrix.experimentalBehaviours}
            tone="amber"
          />
        )}

      {/* Disabled behaviours */}
      {matrix.disabledBehaviours &&
        Object.keys(matrix.disabledBehaviours).length > 0 && (
          <BehavioursSection
            title="Disabled behaviours"
            behaviours={matrix.disabledBehaviours}
            tone="red"
          />
        )}

      {/* Docs link */}
      {matrix.docsHref && (
        <a
          href={matrix.docsHref}
          className="text-mono-xs text-stellar-600 hover:underline dark:text-stellar-400"
        >
          Anchor capability docs →
        </a>
      )}
    </Card>
  );
}
