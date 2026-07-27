# Payment Intent Utilities

Implemented in `packages/stellar-kit/src/payments.ts`, `packages/stellar-kit/src/assets.ts`,
and `packages/stellar-kit/src/intent.ts`.

## Asset parsing

```ts
parseAssetString("XLM");                     // Native XLM
parseAssetString("USDC:GDQJUTQYK2MQ32Z..."); // {type:"issued", code, issuer}
assetToString(asset);                        // "XLM" or "CODE:ISSUER"
createIssuedAsset("USDC", issuerPublicKey);  // throws if code/issuer invalid
assetEquals(a, b);                           // true for same type + code + issuer
```

Native asset is exactly `{type:"native", code:"XLM", issuer:null}`. An empty asset string
coerces to native so that optional fields in the UI behave consistently.

## Amounts

- Strings only, not `number`. Decimal places: **0 to 7**. Value must be `> 0`.
- Range: `0.0000001` (1 stroop) up to `999,999,999,999.9999999`.
- Validators are in `@anchorkit/validators` (`PaymentAmountSchema`). Helpers:

```ts
validateAmount("100.5");      // SafeParseReturnType
isAmountValid("0.0000001");   // true
normalizeAmount("1");         // "1.0000000"
compareAmounts("2", "1.9");   // +1
isAmountGreaterThan(a, b);
isAmountLessThan(a, b);
```

## Memos

```ts
import {
  createEmptyMemo, createTextMemo, createIdMemo, isMemoValid, memoLengthTextBytes,
} from "@anchorkit/stellar-kit";

isMemoValid(createTextMemo("hello"));              // true
memoLengthTextBytes("café");                        // 4 (UTF-8 bytes, not codepoints)
```

Rules:
- `text`: ≤ 28 **bytes** of UTF-8.
- `id`: non-negative integer as a string.
- `hash`, `return`: exactly 64 hex characters.
- `none`: always allowed.

## Payment intents and readiness

Build a `PaymentIntent`:

```ts
const intent = createPaymentIntent({
  sourcePublicKey: source,
  destinationPublicKey: dest,
  asset: parseAssetString("XLM").data!,
  amount: "100.5000000",
  memo: createTextMemo("Invoice #42"),
});
```

Check readiness in two modes:

- `estimateTransactionReadinessSync(intent, options)` — pure. Pass simulated
  `sourceAccountFunded`/`destAccountFunded` flags for fast UI feedback.
- `estimateTransactionReadiness(intent, options)` — async, actually calls Horizon via
  `getAccountStatus` on source and destination.

Return shape:

```ts
{
  ready: boolean,
  warnings: Array<{ code, message, severity: "error" | "warning" | "info" }>,
  summary: string,
}
```

Readiness error codes surfaced today: `SOURCE_INVALID`, `DEST_INVALID`, `ASSET_INVALID`,
`AMOUNT_INVALID`, `MEMO_INVALID`, `MAINNET_DISABLED`, `SAME_SOURCE_DEST`, `SOURCE_UNFUNDED`,
`DEST_UNFUNDED`.

## Submission

The MVP does **not** submit real transactions. When a contributor adds testnet submission it
must be behind a clearly labelled testnet-only toggle and must re-run readiness checks first.
