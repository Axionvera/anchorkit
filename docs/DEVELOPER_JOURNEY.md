# AnchorKit End-to-End Developer Journey

This guide walks through a complete AnchorKit development session, from
account diagnostics to payment readiness, anchor lifecycle management,
and escrow milestone tracking. Each section builds on the previous one,
showing how the monorepo modules fit together as a single toolkit.

For module-level reference, see the individual docs linked at the bottom
of this guide. For local setup, see [LOCAL_SETUP.md](./LOCAL_SETUP.md).

## Who this guide is for

- Contributors exploring the monorepo for the first time.
- Developers evaluating AnchorKit for a Stellar project.
- GrantFox participants looking for context before picking up an issue.

## Architecture at a glance

AnchorKit follows a layered dependency model. Higher layers depend on
lower ones; the reverse is never permitted.

```
apps/web              Presentation layer (Next.js, Tailwind)
    |
    +-- anchor-utils  Anchor lifecycle helpers, status messages, fixtures
    +-- stellar-kit   Stellar accounts, assets, payments, events, diagnostics
    +-- validators    Zod schemas, runtime validation
    +-- config        Network presets, testnet-first defaults
    +-- types         Shared branded types and event models

contracts/treasury-escrow   Soroban Rust contract (independent boundary)
examples/                   Seed JSON fixtures (validated against schemas)
```

The contract and the TypeScript layer integrate through Soroban events:
the contract emits events, `stellar-kit` parses them, and `apps/web`
renders them. See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full
boundary map.

## Prerequisites

| Tool    | Minimum | Purpose                                 |
| ------- | ------- | --------------------------------------- |
| Node.js | 20.x    | All TypeScript packages and the web app |
| pnpm    | 9.x     | Workspace package management            |
| Rust    | 1.81+   | Contract tests and builds (optional)    |

```bash
git clone git@github.com:stellar-commons-labs/anchorkit.git
cd anchorkit
pnpm install
```

---

## Phase 1 -- Account diagnostics

**Goal:** Generate a testnet keypair, validate it, look up its funded
status, and view the diagnostics report.

**Packages involved:** `@anchorkit/stellar-kit`, `@anchorkit/validators`,
`@anchorkit/config`, `@anchorkit/types`.

### 1.1 Generate a testnet keypair

```ts
import { generateTestnetKeypair, secretKeyToRedactedString } from "@anchorkit/stellar-kit";

const keypair = generateTestnetKeypair();
console.log("Public key:", keypair.publicKey);
console.log("Secret (redacted):", secretKeyToRedactedString(keypair.secretKey));
// Secret keys are never logged in full. See docs/SECRET_KEY_HANDLING.md.
```

The returned keys are branded types (`StellarPublicKey`, `StellarSecretKey`),
so downstream functions that expect a validated key accept them without
additional parsing.

### 1.2 Validate a public key

```ts
import { isPublicKeyValid } from "@anchorkit/stellar-kit";

if (!isPublicKeyValid(userInput)) {
  console.error("Not a valid Stellar public key.");
}
```

Validation checks: exact length of 56, `G` prefix, and RFC 4648 base32
characters. It does not perform a network call.

For secret keys, use `validateSecretKeyQuietly` to avoid allocating an
error object when you only need a boolean.

### 1.3 Look up account status

```ts
import { loadAccount, getAccountStatus } from "@anchorkit/stellar-kit";

const info = await loadAccount("GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR");
// info.status: "funded" | "unfunded" | "unknown" | "error"
```

`loadAccount` uses the Horizon endpoint from `@anchorkit/config`. Network
selection defaults to testnet; mainnet is explicitly disabled unless you
override `allowMainnet`.

### 1.4 Run full diagnostics

```ts
import { diagnoseAccount } from "@anchorkit/stellar-kit";

const diag = await diagnoseAccount(keypair.publicKey, { network: "testnet" });
// diag.state: "funded" | "unfunded" | "invalid" | "unavailable" | "unknown"
// diag.reserve: minimum balance awareness (funded accounts only)
// diag.balances: total / reserve / spendable / unavailable
// diag.expertUrl: Stellar Expert link
```

The diagnostics pipeline combines key validation, Horizon lookup, reserve
calculation, and spendable-balance computation into a single result. No
secret keys appear in the output.

**UI reference:** The `/accounts` page in `apps/web` surfaces this pipeline
with a keypair generator, a public key validator, and a live Horizon lookup
panel.

**Test reference:** `packages/stellar-kit/test/diagnostics.test.ts` covers
funded, unfunded, and invalid key paths.

**Fixture reference:** `examples/accounts-funded.json` and
`examples/accounts-unfunded.json`.

---

## Phase 2 -- Payment readiness

**Goal:** Build a payment intent, validate every field, and run the
readiness engine to determine whether the intent is safe to submit.

**Packages involved:** `@anchorkit/stellar-kit`, `@anchorkit/validators`,
`@anchorkit/config`, `@anchorkit/types`.

### 2.1 Parse an asset

```ts
import { parseAssetString, assetToString } from "@anchorkit/stellar-kit";

const native = parseAssetString("XLM"); // { type: "native", code: "XLM", issuer: null }
const issued = parseAssetString("USDC:GDQJUTQYK2MQZ32Z...");
console.log(assetToString(issued)); // "USDC:GDQJUTQYK2MQZ32Z..."
```

An empty or omitted asset string coerces to native XLM so that optional
UI fields behave consistently.

### 2.2 Validate an amount

```ts
import { isAmountValid, normalizeAmount } from "@anchorkit/stellar-kit";

isAmountValid("100.5"); // true
isAmountValid("0"); // false -- must be > 0
normalizeAmount("1"); // "1.0000000" (7 decimal places)
```

Amounts are strings, never floating-point numbers. Valid range:
`0.0000001` (1 stroop) to `999,999,999,999.9999999`.

### 2.3 Build a payment intent

```ts
import { createPaymentIntent, createTextMemo } from "@anchorkit/stellar-kit";

const intent = createPaymentIntent({
  sourcePublicKey: keypair.publicKey,
  destinationPublicKey: "GBZF...DEST",
  asset: parseAssetString("XLM").data,
  amount: "100.5000000",
  memo: createTextMemo("Invoice #42"),
});
```

A `PaymentIntent` is a plain data object; it does not sign or submit
anything.

### 2.4 Check readiness (synchronous)

```ts
import { estimateTransactionReadinessSync } from "@anchorkit/stellar-kit";

const result = estimateTransactionReadinessSync(intent, {
  network: "testnet",
});
// result.state: "ready" | "warnings" | "unsafe-network" | "blocked"
// result.stages: per-stage results in execution order
// result.warnings: typed warning array
```

The synchronous variant runs all validation stages without network calls.
Pass optional `sourceAccountFunded` / `destAccountFunded` flags for fast
UI feedback.

### 2.5 Check readiness (async, with balance awareness)

```ts
import { estimateTransactionReadiness } from "@anchorkit/stellar-kit";

const result = await estimateTransactionReadiness(intent, {
  network: "testnet",
});
// Additionally checks: SOURCE_UNFUNDED, DEST_UNFUNDED,
// INSUFFICIENT_FUNDS, SPENDABLE_UNKNOWN
```

The async variant calls Horizon to load source and destination accounts
and computes the spendable-balance model. It never submits a transaction.

### 2.6 Readiness stages

The engine runs these stages in order:

1. **account-source** -- source public key validity.
2. **account-dest** -- destination public key validity and same-source check.
3. **asset** -- asset configuration validity.
4. **amount** -- amount validity and range.
5. **memo** -- memo value valid for its declared type.
6. **network** -- mainnet safety (disabled by default).
7. **balance** -- funding status and native spendable-balance check.

Each stage produces a `pass`, `warn`, or `fail` status. The aggregate
`state` is the single source of truth for UI branching.

**UI reference:** The `/payments` page renders the readiness badge, the
per-stage grid, and the full warning list. Submission is disabled unless
`state` is `ready` or `warnings`.

**Test reference:** `packages/stellar-kit/test/readiness.test.ts` covers
valid, invalid-asset, invalid-amount, unfunded, insufficient-funds, and
unsafe-network scenarios.

**Fixture reference:** `examples/payment-readiness.example.json` and
`examples/payments-valid-intent.json`.

---

## Phase 3 -- Anchor lifecycle

**Goal:** Create anchor deposit and withdrawal requests, validate them,
step through the status state machine, and render user-facing messages.

**Packages involved:** `@anchorkit/anchor-utils`, `@anchorkit/validators`,
`@anchorkit/types`.

### 3.1 Validate a deposit request

```ts
import { validateAnchorRequest } from "@anchorkit/anchor-utils";

const result = validateAnchorRequest("deposit", {
  assetCode: "USDC",
  amount: "500.00",
  account: "GABC...PUB",
  memo: "ref-123",
});

if (!result.ok) {
  // result.errors: ValidationError[] -- safe to show to users
  console.error(result.errors.map((e) => `[${e.code}] ${e.message}`));
} else {
  // result.value: DepositRequestMetadata
  submitToAnchor(result.value);
}
```

The validation engine wraps Zod schemas in a stable `ValidationResult<T>`
so callers never need to inspect raw `ZodError` internals. Error codes
are deterministic strings (`INVALID_DEPOSIT_METADATA`,
`INVALID_WITHDRAWAL_METADATA`) suitable for branching.

### 3.2 Validate anchor configuration

```ts
import { validateAnchorAssetConfig, validateCallbackUrl } from "@anchorkit/anchor-utils";

validateAnchorAssetConfig({
  code: "USDC",
  issuer: "GDQJUTQYK...",
  schema: "stellar",
  enabled: true,
  depositEnabled: true,
  withdrawalEnabled: true,
});

// Callbacks must be HTTPS in production; localhost is allowed for testing.
validateCallbackUrl("https://anchor.example.com/webhook");
```

### 3.3 Step through the status state machine

Anchor transactions move through a defined set of states:

```
pending_user -> pending_anchor -> pending_stellar -> completed
                                      |
                                      +-> failed
                                      +-> refunded
```

Only the edges above are legal. Terminal states (`completed`, `failed`,
`refunded`) have no outgoing transitions.

```ts
import {
  isTransitionValid,
  transition,
  nextStatus,
  findFirstIllegalTransition,
  TERMINAL_STATUSES,
} from "@anchorkit/anchor-utils";

isTransitionValid("pending_user", "pending_anchor"); // true
isTransitionValid("pending_user", "completed"); // false

const result = transition("pending_stellar", "failed");
// { ok: true, status: "failed" }

nextStatus("pending_anchor"); // "pending_stellar"
nextStatus("completed"); // null (terminal)
```

### 3.4 Render user-facing messages

```ts
import { anchorStatusToUserMessage, anchorStatusBadge } from "@anchorkit/anchor-utils";

const message = anchorStatusToUserMessage("pending_anchor", "deposit");
// { headline, detail, cta, severity }

const badge = anchorStatusBadge("pending_stellar");
// { label, tone }
```

`anchor-utils` returns plain data. The web application decides how to
render it (badge colours, notification style, layout).

### 3.5 Build mock lifecycle records

```ts
import {
  buildDepositLifecycle,
  buildWithdrawalLifecycle,
  createMockAnchorTransactionRecord,
} from "@anchorkit/anchor-utils";

const depositTimeline = buildDepositLifecycle();
// 4 records: pending_user -> pending_anchor -> pending_stellar -> completed

const withdrawalTimeline = buildWithdrawalLifecycle();
// 5 records: includes failed and refunded states

const custom = createMockAnchorTransactionRecord({
  kind: "deposit",
  status: "pending_anchor",
  assetCode: "XLM",
  amountIn: "100",
  stellarAccount: keypair.publicKey,
  message: "Processing the SEPA transfer.",
});
```

Use these in unit tests and dashboard demos. IDs and timestamps are
generated fresh on each call.

**UI reference:** The `/anchors` page renders deposit and withdrawal
lifecycle timelines and an interactive transition panel that flags
illegal moves in real time.

**Test reference:** `packages/anchor-utils/test/anchor.test.ts` (18 tests)
and `packages/anchor-utils/test/lifecycle.test.ts`.

**Fixture reference:** `examples/anchors-deposit-lifecycle.json` and
`examples/anchors-withdrawal-lifecycle.json`.

---

## Phase 4 -- Escrow milestones

**Goal:** Understand the Soroban treasury-escrow contract lifecycle,
parse milestone events from the contract, and display them.

**Packages involved:** `contracts/treasury-escrow` (Rust), `@anchorkit/stellar-kit`,
`@anchorkit/types`.

### 4.1 Contract lifecycle

The `treasury-escrow` contract manages milestones through a directed
state graph:

```
draft -> active -> evidence_submitted -> approved -> ready_for_release -> released
                       \
                        -> disputed   (blocks further approval)
```

All mutating calls require admin authorisation. The contract emits a
typed event at each transition.

| Step     | Function                                   | Guards                                       |
| -------- | ------------------------------------------ | -------------------------------------------- |
| Create   | `create_milestone(env, id, title, amount)` | `id != 0`, `amount > 0`, unique id           |
| Evidence | `submit_evidence(env, id, hash)`           | Status < Released, write-once                |
| Approve  | `approve_milestone(env, id)`               | Evidence present, not disputed               |
| Dispute  | `dispute_milestone(env, id, reason)`       | Evidence submitted, not released             |
| Ready    | `mark_ready_for_release(env, id)`          | Status == Approved                           |
| Release  | `release_milestone(env, id)`               | Status == ReadyForRelease, no double-release |

Disputes are terminal in the current contract. Resolution happens
off-chain or in a future entry point (see the
[roadmap](./ROADMAP.md) for planned extensions).

### 4.2 Build and test the contract

```bash
# Run contract tests (15 tests covering happy path, guards, and auth)
pnpm contract:test

# Build the WASM artifact
pnpm contract:build
# Output: contracts/treasury-escrow/target/wasm32-unknown-unknown/release/treasury_escrow.wasm
```

### 4.3 Deploy and initialise (testnet)

```bash
soroban contract install \
  --wasm target/wasm32-unknown-unknown/release/treasury_escrow.wasm \
  --network testnet

soroban contract deploy \
  --wasm-hash <hash> \
  --source <admin_account> \
  --network testnet

soroban contract invoke \
  --id <deployed_id> -- initialize --admin <admin_address> \
  --network testnet
```

Deploy and initialise in the same session. A contract left uninitialised
can be claimed by any caller (first-caller-wins).

### 4.4 Parse contract events in TypeScript

```ts
import { parseEscrowEvents } from "@anchorkit/stellar-kit";
import type { RawEscrowEvent } from "@anchorkit/types";

// rawEvents: from server.getEvents(...) or a wallet/indexer stream
const { events, failures } = parseEscrowEvents(rawEvents as RawEscrowEvent[]);

for (const event of events) {
  switch (event.type) {
    case "milestone_created":
      console.log(`Created: ${event.title}, amount: ${event.amount}`);
      break;
    case "evidence_submitted":
      console.log(`Evidence for milestone ${event.milestoneId}`);
      break;
    case "approved":
      console.log(`Milestone ${event.milestoneId} approved`);
      break;
    case "disputed":
      console.warn(`Dispute on ${event.milestoneId}: ${event.disputeReason}`);
      break;
    case "ready_for_release":
      console.log(`Milestone ${event.milestoneId} ready for release`);
      break;
    case "released":
      console.log(`Released milestone ${event.milestoneId}: ${event.amount}`);
      break;
  }
}

// failures: { ok: false, error, raw }[] -- bad events never crash the stream
```

The mapper never throws. Unrecognised events are collected in `failures`
so a single malformed event does not break the consumer.

### 4.5 Read contract state

```rust
// From a Soroban client or CLI:
read_milestone(env, milestone_id) -> Milestone
read_summary(env) -> EscrowSummary {
    admin, total_milestones, total_amount,
    released_amount, pending_amount, disputed_count, completed_count,
}
```

**UI reference:** The `/escrow` page renders parsed events from
`examples/escrow-events-example.json` and provides a milestone
step-through interface.

**Test reference:** `contracts/treasury-escrow/src/test.rs` (15 tests)
and `packages/stellar-kit/test/escrowEvents.test.ts`.

**Fixture reference:** `examples/escrow-milestone-lifecycle.json` and
`examples/escrow-events-example.json`.

---

## Putting it all together

A typical AnchorKit integration follows this flow:

```
1. Account diagnostics
   Generate or import a keypair
   Validate the public key
   Check funded status and spendable balance
       |
       v
2. Payment readiness
   Build a payment intent (asset + amount + memo + addresses)
   Run the readiness engine (7 validation stages)
   Surface warnings or proceed
       |
       v
3. Anchor lifecycle
   Submit a deposit or withdrawal request to an anchor
   Validate request metadata through the validation engine
   Track status transitions through the state machine
   Render user-facing messages and badges
       |
       v
4. Escrow milestones
   Create milestones in the Soroban treasury-escrow contract
   Submit evidence, get approval, mark ready, release
   Parse contract events in TypeScript
   Display milestone progress in the UI
```

Each phase is independent. You can use account diagnostics without
anchors, or the escrow contract without the payments module. The
shared types, validators, and configuration ensure consistency across
all combinations.

## Cross-cutting concerns

### Safety defaults

- **Testnet first.** Mainnet is disabled by default. Any attempt to
  reach mainnet without `allowMainnet: true` throws a typed
  `MAINNET_DISABLED` error before any network call.
- **Secret redaction.** Secret keys are redacted in logs, errors, and
  UI output. See [SECRET_KEY_HANDLING.md](./SECRET_KEY_HANDLING.md) for
  rules R0 through R6.
- **No fund custody.** Nothing in the MVP stores or signs with real
  private keys on a user's behalf.
- **Validation before network.** All public APIs validate inputs with
  Zod before making any network call.

### Validation engine

The shared validation engine (`@anchorkit/validators` +
`@anchorkit/anchor-utils`) wraps Zod schemas in a stable
`ValidationResult<T>` so callers get typed error codes, user-safe
messages, and field paths without inspecting Zod internals.

See [validation-engine.md](./validation-engine.md) for the full API.

### Error taxonomy

Errors across the toolkit use typed codes (`StellarKitError`,
`AnchorValidationErrorCode`, `ReadinessWarningCode`). Callers can match
on `error.code` for programmatic handling.

See [ERROR_TAXONOMY.md](./ERROR_TAXONOMY.md) for the full list.

### Explorer links

All Stellar Expert and Horizon URLs are generated through helpers in
`@anchorkit/stellar-kit`. The UI never hardcodes explorer URLs.

See [explorer-links.md](./explorer-links.md) for the API.

## Web dashboard routes

The `apps/web` dashboard surfaces each phase of this journey:

| Route        | Journey phase          | Main packages                         |
| ------------ | ---------------------- | ------------------------------------- |
| `/`          | Landing and navigation | Presentation only                     |
| `/dashboard` | Module overview        | Presentation only                     |
| `/accounts`  | Phase 1 (diagnostics)  | `stellar-kit`, `types`                |
| `/payments`  | Phase 2 (readiness)    | `stellar-kit`, `config`, `types`      |
| `/anchors`   | Phase 3 (anchor)       | `anchor-utils`, `validators`, `types` |
| `/escrow`    | Phase 4 (milestones)   | `stellar-kit`, `types`                |
| `/docs`      | Documentation index    | Documentation links                   |

Start the dashboard with:

```bash
pnpm web:dev
# http://localhost:3000
```

## Examples and fixtures

Every flow in this guide has corresponding seed fixtures under
`examples/`. These fixtures are validated against the same Zod schemas
the application uses, so they never drift out of sync.

| Fixture file                        | Journey phase |
| ----------------------------------- | ------------- |
| `accounts-funded.json`              | Phase 1       |
| `accounts-unfunded.json`            | Phase 1       |
| `payments-valid-intent.json`        | Phase 2       |
| `payments-invalid-intent.json`      | Phase 2       |
| `payment-readiness.example.json`    | Phase 2       |
| `anchors-deposit-lifecycle.json`    | Phase 3       |
| `anchors-withdrawal-lifecycle.json` | Phase 3       |
| `escrow-milestone-lifecycle.json`   | Phase 4       |
| `escrow-events-example.json`        | Phase 4       |

Run `pnpm check:examples` to validate all fixtures locally. The same
checks run in CI.

## Test coverage

| Test suite                         | Journey phase | Command                                      |
| ---------------------------------- | ------------- | -------------------------------------------- |
| `stellar-kit/test/diagnostics`     | Phase 1       | `pnpm --filter=@anchorkit/stellar-kit test`  |
| `stellar-kit/test/keys`            | Phase 1       | `pnpm --filter=@anchorkit/stellar-kit test`  |
| `stellar-kit/test/readiness`       | Phase 2       | `pnpm --filter=@anchorkit/stellar-kit test`  |
| `stellar-kit/test/payments`        | Phase 2       | `pnpm --filter=@anchorkit/stellar-kit test`  |
| `anchor-utils/test/anchor`         | Phase 3       | `pnpm --filter=@anchorkit/anchor-utils test` |
| `anchor-utils/test/lifecycle`      | Phase 3       | `pnpm --filter=@anchorkit/anchor-utils test` |
| `validators/test/validationEngine` | Phase 3       | `pnpm --filter=@anchorkit/validators test`   |
| `validators/test/examples`         | All phases    | `pnpm --filter=@anchorkit/validators test`   |
| `stellar-kit/test/escrowEvents`    | Phase 4       | `pnpm --filter=@anchorkit/stellar-kit test`  |
| `treasury-escrow/src/test.rs`      | Phase 4       | `pnpm contract:test`                         |

Run the full suite:

```bash
pnpm test           # all TypeScript tests
pnpm contract:test  # Soroban Rust contract tests
```

## Roadmap

The features described in this guide correspond to the shipped MVP
(v0.1). Planned extensions include:

- **v0.2:** SEP-10 web-auth client helper, testnet transaction builder,
  contract client in TypeScript, local persistence.
- **v0.3:** Batch grant payouts, anchor record store, contract upgrade
  with dispute resolution and token integration.
- **v1.0:** Audited mainnet paths, SEP-24 reference server, wallet
  adapter abstraction.

See [ROADMAP.md](./ROADMAP.md) for the full plan.

## Related documentation

- [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) -- project context and design principles
- [ARCHITECTURE.md](./ARCHITECTURE.md) -- full package boundary map
- [LOCAL_SETUP.md](./LOCAL_SETUP.md) -- installation and setup
- [ACCOUNT_UTILITIES.md](./ACCOUNT_UTILITIES.md) -- key and account API reference
- [PAYMENT_INTENT_UTILITIES.md](./PAYMENT_INTENT_UTILITIES.md) -- payment API reference
- [ANCHOR_UTILITIES.md](./ANCHOR_UTILITIES.md) -- anchor API reference
- [SOROBAN_ESCROW_CONTRACT.md](./SOROBAN_ESCROW_CONTRACT.md) -- contract reference
- [account-diagnostics.md](./account-diagnostics.md) -- diagnostics pipeline details
- [transaction-readiness.md](./transaction-readiness.md) -- readiness engine details
- [anchor-lifecycle.md](./anchor-lifecycle.md) -- state machine details
- [escrow-events.md](./escrow-events.md) -- event schema details
- [validation-engine.md](./validation-engine.md) -- validation engine details
- [examples.md](./examples.md) -- fixture consistency
- [SECURITY_NOTES.md](./SECURITY_NOTES.md) -- security guidelines
- [SECRET_KEY_HANDLING.md](./SECRET_KEY_HANDLING.md) -- secret key rules R0-R6
- [ERROR_TAXONOMY.md](./ERROR_TAXONOMY.md) -- error code reference
- [CONTRIBUTOR_GUIDE.md](./CONTRIBUTOR_GUIDE.md) -- contribution workflow
- [ROADMAP.md](./ROADMAP.md) -- planned releases
