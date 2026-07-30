import type { TransactionReceipt } from "@anchorkit/types";
import { getReceiptSeverity } from "@anchorkit/stellar-kit";
import { Alert, Card, DataRow, TransactionReceiptBadge } from "@/components/ui";

export function TransactionReceiptPanel({
  receipt,
  title = "Transaction receipt",
}: {
  receipt: TransactionReceipt | null;
  title?: string;
}) {
  if (!receipt) {
    return (
      <Alert tone="warning" title="No receipt">
        A transaction receipt will appear here after submission or when mapped from anchor/escrow
        data.
      </Alert>
    );
  }

  const severity = getReceiptSeverity(receipt.status);

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
        <TransactionReceiptBadge status={receipt.status} />
      </div>
      <Alert tone={severity.level} title={receipt.headline}>
        {receipt.detail}
      </Alert>
      <dl className="divide-y divide-ink-100 dark:divide-ink-800">
        <DataRow
          label="Receipt id"
          value={<span className="font-mono text-xs">{receipt.id}</span>}
        />
        <DataRow label="Source" value={receipt.source} />
        <DataRow label="Network" value={receipt.network} />
        {receipt.transactionHash && (
          <DataRow
            label="Transaction hash"
            value={<span className="font-mono text-xs break-all">{receipt.transactionHash}</span>}
          />
        )}
        {receipt.explorerUrl && (
          <DataRow
            label="Explorer"
            value={
              <a
                href={receipt.explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="text-stellar-600 underline dark:text-stellar-400"
              >
                View on Stellar Expert ↗
              </a>
            }
          />
        )}
        {receipt.submittedAt && (
          <DataRow label="Submitted" value={new Date(receipt.submittedAt).toLocaleString()} />
        )}
        {receipt.finalizedAt && (
          <DataRow label="Finalized" value={new Date(receipt.finalizedAt).toLocaleString()} />
        )}
        {receipt.errorCode && <DataRow label="Error code" value={receipt.errorCode} />}
      </dl>
    </Card>
  );
}
