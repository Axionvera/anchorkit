# Transaction summaries (issue #90)

AnchorKit exposes a reusable **transaction summary** model so payment, anchor,
and escrow preview screens can present a consistent review-before-action
surface. Summaries include operation type, parties, amount, asset, network,
memo, fee estimate, and risk notes where available.

## Result shape

```ts
type TransactionSummaryOperation =
  | "payment"
  | "anchor_deposit"
  | "anchor_withdrawal"
  | "escrow_release"
  | "other";

interface TransactionSummary {
  id: string;
  operation: TransactionSummaryOperation;
  source: "payment" | "anchor" | "escrow" | "other";
  network: StellarNetwork;
  headline: string;
  detail?: string;
  parties: TransactionSummaryParty[];
  amount?: string;
  asset?: StellarAsset;
  memo?: MemoInput;
  feeEstimate?: TransactionSummaryFeeEstimate;
  riskNotes: TransactionSummaryRiskNote[];
  metadata?: Record<string, unknown>;
}
```

Summaries are distinct from:

| concept | when to use |
| --- | --- |
| `TransactionReadiness` / readiness pipeline | **before** submit — validation engines |
| `TransactionSummary` | **before** submit — review / preview UX |
| `TransactionReceipt` | **after** submit — normalized outcome |

## Limitations

- **No protocol fee estimator.** Payment and escrow summaries mark fees as
  `source: "unavailable"` unless a caller supplies a manual estimate. AnchorKit
  does not query Horizon fee stats in the MVP.
- **Anchor fees are optional.** When `feeFixed` / `feePercent` (config) or
  `feeAmount` (record) is present, the summary copies it; otherwise fees remain
  unavailable.
- **Risk notes are inputs, not a third readiness engine.** Pass readiness
  warnings through `riskNotes` when you already have them. The summary builder
  does not re-run account or network diagnostics.
- **Escrow parties are optional.** Milestone data alone may not include admin
  or recipient keys; supply them when the UI knows them.
- **Mock / testnet only.** Dashboard flows remain simulations. Summaries must
  not be treated as authorization to move mainnet funds.

## API

```ts
import {
  buildTransactionSummary,
  paymentIntentToSummary,
  anchorRequestToSummary,
  anchorRecordToSummary,
  escrowMilestoneToSummary,
  createMockTransactionSummary,
  parseTransactionSummary,
} from "@anchorkit/stellar-kit";

const paymentSummary = paymentIntentToSummary({
  intent,
  network: "testnet",
  riskNotes: readiness.warnings,
});

const depositSummary = anchorRequestToSummary({
  kind: "deposit",
  request: depositDraft,
  assetConfig,
});

const escrowSummary = escrowMilestoneToSummary({
  milestone,
  adminPublicKey,
  destinationPublicKey,
});
```

## UI

`apps/web/components/TransactionSummaryPanel.tsx` renders any
`TransactionSummary` with operation, parties, amount/asset, memo, fee estimate,
and risk notes. The panel is used on:

- **Payments** — review summary derived from the live payment intent
- **Anchors** — deposit and withdrawal request summaries
- **Escrow** — release review summary for the selected milestone

## Fixtures & tests

- `examples/transaction-summaries.example.json` — one summary per operation.
- `packages/stellar-kit/test/summary.test.ts` — payment / anchor / escrow
  converters, fee availability, risk notes, and parse validation.

## Alignment with readiness & receipts

Use **readiness** to decide whether an action is safe, **summaries** to show
what the user is about to do, and **receipts** after submission. Do not replace
readiness checks with summary panels.
