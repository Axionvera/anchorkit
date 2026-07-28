# Transaction Readiness Pipeline

AnchorKit exposes a unified, cross-monorepo **Transaction Readiness Pipeline** in `@anchorkit/stellar-kit` (`readiness.ts`). It coordinates network safety checks, account diagnostics, asset validation, amount limits, minimum reserve calculations, memo rules, and UI readiness states across packages and the Next.js web application.

---

## 1. Overview & Architecture

Transaction readiness is evaluated across **5 distinct validation stages**:

1. **`network`**: Validates network configuration, passphrase resolution, and network safety rules (e.g. mainnet access is explicitly disabled by default via `allowMainnet: false`).
2. **`account`**: Integrates `diagnoseAccount` / `diagnoseAccountInfo` diagnostics for source and destination accounts. Validates public key formats, funded states, reserve requirements (base reserve + subentries), and balance sufficiency.
3. **`asset`**: Validates native vs issued Stellar assets, code length (1-12 alphanumeric characters), issuer key validity, and destination trustline requirements for issued assets.
4. **`amount`**: Validates decimal precision (up to 7 decimals), positivity (`> 0`), and configured minimum/maximum bounds (`minimumPaymentAmount` / `maximumPaymentAmount`). Checks that source XLM balance covers payment amount plus minimum reserve requirements.
5. **`memo`**: Validates memo type (`none`, `text`, `id`, `hash`, `return`), UTF-8 byte limits (≤ 28 bytes for text), numeric bounds for ID memos, and 64 hex characters for hash/return memos.

---

## 2. Typed Readiness States

Every readiness assessment resolves to one of **5 typed readiness states**:

| State | Status | Description | `ready` |
|---|---|---|---|
| **`valid`** | Fully Ready | All 5 validation stages passed with zero errors or warnings. | `true` |
| **`warning`** | Ready w/ Warnings | Payment intent can proceed, but contains non-blocking warnings (e.g. same source/dest account or unfunded dest for XLM payment). | `true` |
| **`blocked`** | Blocked | Critical business/account requirements prevent execution (e.g. unfunded source, missing trustline, mainnet access disabled, or insufficient reserve). | `false` |
| **`invalid`** | Invalid Input | Malformed public keys, invalid amount format, malformed asset code/issuer, or invalid memo. | `false` |
| **`unavailable`** | Diagnostics Unavailable | Network or RPC failure prevented loading account diagnostics. | `false` |

---

## 3. Account Reserve Awareness

The account stage incorporates protocol reserve requirements:

$$\text{Minimum Balance (XLM)} = 2.0 + (\text{subentries} + 2) \times 0.5$$

If the payment asset is native XLM, the pipeline verifies:

$$\text{Source Balance} \ge \text{Payment Amount} + \text{Minimum Balance Requirement}$$

If the source balance is insufficient to cover the payment amount plus minimum reserve, the account stage resolves to `blocked` with an `INSUFFICIENT_BALANCE` issue code.

---

## 4. Usage Examples

### Synchronous Evaluation (Simulated or Pre-loaded Diagnostics)

```ts
import { createPaymentIntent, evaluateTransactionReadinessSync } from "@anchorkit/stellar-kit";

const intent = createPaymentIntent({
  sourcePublicKey: "GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR",
  destinationPublicKey: "GDQJUTQYK2MQ32ZGMMB7Q3UKTJLNTMZI2QYHW7OK2TK2DZI3X5IGQH6U",
  asset: { type: "native", code: "XLM", issuer: null },
  amount: "100.5000000",
});

const readiness = evaluateTransactionReadinessSync(intent, {
  network: "testnet",
  sourceAccountFunded: true,
  destAccountFunded: true,
  sourceBalanceXlm: "1000.0000000",
});

console.log(readiness.state); // "valid"
console.log(readiness.ready); // true
console.log(readiness.stages.account.state); // "valid"
```

### Asynchronous Evaluation (Network Account Diagnostics)

```ts
import { createPaymentIntent, evaluateTransactionReadiness } from "@anchorkit/stellar-kit";

const readiness = await evaluateTransactionReadiness(intent, {
  network: "testnet",
});

if (readiness.ready) {
  console.log("Ready to sign payment intent.");
} else {
  console.warn("Transaction readiness blocked or invalid:", readiness.summary);
}
```

---

## 5. Testnet-First Safety & Limitations

- **Testnet-First**: Mainnet access is disabled by default for safety. Set `allowMainnet: true` in config only after reviewing security notes.
- **No Real Payments**: The readiness pipeline performs diagnostics and validation only. It does **not** sign or submit transactions to the Stellar network.
- **Graceful Degradation**: Network connectivity failures gracefully transition the state to `unavailable` rather than throwing uncaught exceptions.
