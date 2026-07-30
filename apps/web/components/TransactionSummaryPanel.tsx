import type { TransactionSummary, TransactionSummaryRiskNote } from "@anchorkit/types";
import { Alert, Card, DataRow, StatusBadge } from "@/components/ui";

function riskTone(severity: TransactionSummaryRiskNote["severity"]): "error" | "warning" | "info" {
  if (severity === "error") return "error";
  if (severity === "warning") return "warning";
  return "info";
}

function formatAsset(summary: TransactionSummary): string {
  if (!summary.asset) return "—";
  if (summary.asset.type === "native") return "XLM";
  return `${summary.asset.code}:${summary.asset.issuer.slice(0, 8)}…`;
}

function formatMemo(summary: TransactionSummary): string {
  if (!summary.memo || summary.memo.type === "none") return "None";
  return `${summary.memo.type}: ${summary.memo.value || "(empty)"}`;
}

function formatFee(summary: TransactionSummary): string {
  const fee = summary.feeEstimate;
  if (!fee) return "Unavailable";
  if (fee.amount) {
    return `${fee.amount}${fee.assetCode ? ` ${fee.assetCode}` : ""} (${fee.source})`;
  }
  return `Unavailable (${fee.source})`;
}

export function TransactionSummaryPanel({
  summary,
  title = "Transaction summary",
}: {
  summary: TransactionSummary | null;
  title?: string;
}) {
  if (!summary) {
    return (
      <Alert tone="warning" title="No summary">
        A review summary will appear here once the payment, anchor, or escrow draft is ready.
      </Alert>
    );
  }

  const blocking = summary.riskNotes.filter((n) => n.severity === "error");
  const warnings = summary.riskNotes.filter((n) => n.severity !== "error");

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
        <StatusBadge
          severity={{
            label: summary.operation.replace(/_/g, " "),
            tone: "neutral",
          }}
          showDot={false}
        />
      </div>

      <Alert tone={blocking.length > 0 ? "warning" : "info"} title={summary.headline}>
        {summary.detail}
      </Alert>

      <dl className="divide-y divide-ink-100 dark:divide-ink-800">
        <DataRow label="Network" value={summary.network} />
        <DataRow
          label="Amount"
          value={
            <span className="text-mono-sm">
              {summary.amount ?? "—"} {summary.amount ? formatAsset(summary) : ""}
            </span>
          }
        />
        <DataRow label="Asset" value={formatAsset(summary)} />
        <DataRow label="Memo" value={formatMemo(summary)} />
        <DataRow
          label="Fee estimate"
          value={
            <span className="text-right">
              <span className="block">{formatFee(summary)}</span>
              {summary.feeEstimate?.note && (
                <span className="mt-0.5 block text-xs italic text-ink-400 dark:text-ink-500">
                  {summary.feeEstimate.note}
                </span>
              )}
            </span>
          }
        />
      </dl>

      {summary.parties.length > 0 && (
        <section>
          <h4 className="mb-1 text-sm font-semibold text-ink-700 dark:text-ink-300">Parties</h4>
          <dl className="divide-y divide-ink-100 dark:divide-ink-800">
            {summary.parties.map((p, idx) => (
              <DataRow
                key={`${p.role}-${idx}`}
                label={p.label}
                value={
                  <span className="text-right">
                    {p.publicKey && (
                      <span className="block font-mono text-xs break-all">{p.publicKey}</span>
                    )}
                    {p.detail && (
                      <span className="block text-xs text-ink-500 dark:text-ink-400">{p.detail}</span>
                    )}
                  </span>
                }
              />
            ))}
          </dl>
        </section>
      )}

      {(blocking.length > 0 || warnings.length > 0) && (
        <section className="space-y-2">
          <h4 className="text-sm font-semibold text-ink-700 dark:text-ink-300">Risk notes</h4>
          {summary.riskNotes.map((note) => (
            <Alert key={note.code + note.message} tone={riskTone(note.severity)} title={note.code}>
              {note.message}
            </Alert>
          ))}
        </section>
      )}
    </Card>
  );
}
