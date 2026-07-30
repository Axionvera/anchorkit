# Transaction receipts (issue #91)

AnchorKit exposes a reusable **transaction receipt** model so payment, anchor,
and escrow surfaces display confirmed, pending, failed, rejected, and unknown
outcomes consistently. Receipts are network-aware and include optional Stellar
Expert explorer links.

## Result shape

```ts
type TransactionReceiptStatus =
  | "confirmed"
  | "pending"
  | "failed"
  | "rejected"
  | "unknown";

interface TransactionReceipt {
  id: string;
  status: TransactionReceiptStatus;
  network: StellarNetwork;
  headline: string;
  detail?: string;
  source: "payment" | "anchor" | "escrow" | "other";
  transactionHash?: StellarTransactionHash;
  explorerUrl?: string;       // network-aware Stellar Expert link
  submittedAt?: string;
  finalizedAt?: string;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}
```

Receipt statuses are distinct from:

| concept | when to use |
| --- | --- |
| `ReadinessState` | **before** submit (payments page) |
| `AnchorTransactionStatus` | SEP-style anchor lifecycle |
| `TransactionReceiptStatus` | **after** submit — normalized UI outcome |

## Status mapping

| receipt status | typical meaning |
| --- | --- |
| `confirmed` | On-chain success or anchor `completed` |
| `pending` | Submitted, awaiting confirmation |
| `failed` | Hard failure (anchor `failed`, tx error) |
| `rejected` | Reversed / refunded / user rejected |
| `unknown` | Outcome not yet determined |

Anchor statuses map via `mapAnchorStatusToReceiptStatus`:

- `pending_user` / `pending_anchor` / `pending_stellar` → `pending`
- `completed` → `confirmed`
- `failed` → `failed`
- `refunded` → `rejected`

## API

```ts
import {
  buildTransactionReceipt,
  attachExplorerLink,
  anchorRecordToReceipt,
  escrowReleaseToReceipt,
  createMockTransactionReceipt,
  parseTransactionReceipt,
  receiptStatusToUserMessage,
  receiptStatusBadge,
} from "@anchorkit/stellar-kit";

// Build from scratch (explorer link attached automatically)
const receipt = buildTransactionReceipt({
  id: "pay_123",
  status: "confirmed",
  network: "testnet",
  source: "payment",
  transactionHash: "a".repeat(64),
});

// Map existing anchor record
const anchorReceipt = anchorRecordToReceipt(anchorRecord, "testnet");

// Map escrow release event
const escrowReceipt = escrowReleaseToReceipt(releasedEvent, "testnet");

// Safe parse for integrations
const parsed = parseTransactionReceipt(json);
if (parsed.success) console.log(parsed.data.explorerUrl);
```

Explorer links are built through `buildTransactionLink` in `explorer.ts` —
never hardcode stellar.expert URLs in application code.

## UI

`apps/web/components/TransactionReceiptPanel.tsx` renders any
`TransactionReceipt` with a shared status badge and an `Alert` whose tone
comes from `getReceiptSeverity(receipt.status).level` (not a local tone
switch). The panel is used on:

- **Payments** — mock post-submit receipt preview
- **Anchors** — receipt derived from the mock anchor record
- **Escrow** — receipt from the released milestone event

## Fixtures & tests

- `examples/transaction-receipts.example.json` — one receipt per status.
- `packages/stellar-kit/test/receipt.test.ts` — status mapping, explorer links,
  anchor/escrow converters, and parse validation.

## Alignment with readiness & diagnostics

Use **readiness** (`estimateTransactionReadinessSync`) before submission and
**receipts** after submission. Account diagnostics (`diagnoseAccount`) remain
independent — they describe account state, not transaction outcomes.
