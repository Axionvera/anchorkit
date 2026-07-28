"use client";

import clsx from "clsx";
import type { AssetDisplayInfo, AssetDisplayState } from "@anchorkit/types";

const STATE_BADGE: Record<AssetDisplayState, { label: string; tone: string }> = {
  native: {
    label: "Native",
    tone: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
  },
  issued: {
    label: "Issued",
    tone: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  },
  unsupported: {
    label: "Unsupported",
    tone: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
  },
  unknown: {
    label: "Unknown",
    tone: "bg-ink-100 text-ink-700 border-ink-200 dark:bg-ink-800 dark:text-ink-300 dark:border-ink-700",
  },
};

export function AssetIconPlaceholder({
  character,
  bgColor,
  size = "md",
}: {
  character: string;
  bgColor: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = { sm: "h-6 w-6 text-xs", md: "h-8 w-8 text-sm", lg: "h-10 w-10 text-base" };
  return (
    <span
      className={clsx(
        "inline-flex items-center justify-center rounded-full font-bold text-white",
        sizes[size],
        bgColor
      )}
    >
      {character}
    </span>
  );
}

function NetworkBadge({ network }: { network: string }) {
  const colors: Record<string, string> = {
    testnet: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
    mainnet: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
    futurenet: "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-mono-xs font-medium",
        colors[network] ?? "bg-ink-100 text-ink-700 border-ink-200"
      )}
    >
      {network}
    </span>
  );
}

export function AssetDisplayCompact({ info }: { info: AssetDisplayInfo }) {
  const badge = STATE_BADGE[info.state];

  return (
    <div className="flex items-center gap-3 rounded-lg border border-ink-200 bg-white p-3 text-sm dark:border-ink-800 dark:bg-ink-950">
      {info.metadata ? (
        <AssetIconPlaceholder
          character={info.metadata.iconPlaceholder.character}
          bgColor={info.metadata.iconPlaceholder.bgColor}
          size="md"
        />
      ) : (
        <AssetIconPlaceholder character="?" bgColor="bg-ink-400" size="md" />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-ink-900 dark:text-ink-50">
            {info.metadata?.displayName ?? "Unknown Asset"}
          </span>
          <span
            className={clsx(
              "inline-flex items-center rounded-full border px-1.5 py-0.5 text-mono-xs font-medium",
              badge.tone
            )}
          >
            {badge.label}
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-ink-500 dark:text-ink-400">
          <span className="font-mono">{info.metadata?.code ?? "—"}</span>
          {info.metadata?.issuer && (
            <span className="max-w-[200px] truncate font-mono text-xs" title={info.metadata.issuer}>
              {info.metadata.issuer.slice(0, 8)}…{info.metadata.issuer.slice(-4)}
            </span>
          )}
          <NetworkBadge network={info.network} />
        </div>
        {info.error && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{info.error}</p>
        )}
      </div>
    </div>
  );
}

export function AssetDisplayDetail({ info }: { info: AssetDisplayInfo }) {
  const badge = STATE_BADGE[info.state];

  return (
    <div className="rounded-xl border border-ink-200 bg-white p-5 dark:border-ink-800 dark:bg-ink-950">
      <div className="flex items-start gap-4">
        {info.metadata ? (
          <AssetIconPlaceholder
            character={info.metadata.iconPlaceholder.character}
            bgColor={info.metadata.iconPlaceholder.bgColor}
            size="lg"
          />
        ) : (
          <AssetIconPlaceholder character="?" bgColor="bg-ink-400" size="lg" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-ink-900 dark:text-ink-50">
              {info.metadata?.displayName ?? "Unknown Asset"}
            </h3>
            <span
              className={clsx(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-mono-xs font-medium",
                badge.tone
              )}
            >
              {badge.label}
            </span>
          </div>

          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <dt className="text-ink-500 dark:text-ink-400">Code:</dt>
              <dd className="font-mono text-ink-900 dark:text-ink-100">
                {info.metadata?.code ?? "—"}
              </dd>
            </div>
            {info.metadata?.issuer && (
              <div className="flex items-center gap-2">
                <dt className="text-ink-500 dark:text-ink-400">Issuer:</dt>
                <dd className="max-w-[300px] truncate font-mono text-xs text-ink-900 dark:text-ink-100">
                  {info.metadata.issuer}
                </dd>
              </div>
            )}
            <div className="flex items-center gap-2">
              <dt className="text-ink-500 dark:text-ink-400">Network:</dt>
              <dd>
                <NetworkBadge network={info.network} />
              </dd>
            </div>
            {info.metadata && info.metadata.networks.length > 0 && (
              <div className="flex items-center gap-2">
                <dt className="text-ink-500 dark:text-ink-400">Supported on:</dt>
                <dd className="flex flex-wrap gap-1">
                  {info.metadata.networks.map((n) => (
                    <NetworkBadge key={n} network={n} />
                  ))}
                </dd>
              </div>
            )}
            {info.metadata?.trustNote && (
              <div className="flex items-start gap-2">
                <dt className="text-ink-500 dark:text-ink-400 shrink-0">Trust:</dt>
                <dd className="text-ink-700 dark:text-ink-300">{info.metadata.trustNote}</dd>
              </div>
            )}
          </dl>

          {info.error && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
              {info.error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
