# AnchorKit Architecture Boundary Map

This document is the architecture reference for the AnchorKit monorepo.

It explains:

- which directory owns each responsibility;
- how packages may depend on one another;
- where new features should be implemented;
- which boundaries are security-sensitive;
- how the web app, TypeScript packages, examples, and Soroban contract integrate.

Contributors should review this document before implementing changes that affect more than one package.

## 1. Architecture principles

AnchorKit follows these principles:

1. **Each responsibility has one clear owner.**
2. **Dependencies flow from higher-level consumers toward lower-level foundations.**
3. **Untrusted data is validated before domain or network logic uses it.**
4. **Shared logic belongs in packages, not in web pages.**
5. **Consumers import packages through their public entry points.**
6. **The Soroban contract is an independent execution and security boundary.**
7. **Examples are executable documentation, not production runtime data.**
8. **Secret handling, network selection, callbacks, transactions, and escrow release logic require security review.**

## 2. Repository boundary map

```text
AnchorKit/
├── apps/
│   └── web/
│       ├── app/                         Next.js routes and feature pages
│       ├── components/                  Shared web presentation components
│       └── lib/                         Web-only adapters and sample display data
│
├── packages/
│   ├── types/                           Shared TypeScript contracts
│   ├── config/                          Network and environment configuration
│   ├── fixtures/                        Shared deterministic test fixtures (no real secrets)
│   ├── validators/                      Runtime validation schemas
│   ├── stellar-kit/                     Stellar network and transaction utilities
│   └── anchor-utils/                    Anchor lifecycle and metadata utilities
│
├── contracts/
│   └── treasury-escrow/
│       └── src/                         Soroban contract and Rust tests
│
├── examples/
│   ├── registry.ts                      Fixture-to-schema registry
│   └── *.json                           Valid and invalid example payloads
│
├── tests/
│   └── integration/                     Public-API cross-package integration tests
│
├── scripts/                             Repository automation
├── docs/                                Architecture and feature documentation
├── package.json                         Root scripts and workspace orchestration
├── pnpm-workspace.yaml                  Workspace membership
├── turbo.json                           Task dependency configuration
└── tsconfig.base.json                   Shared TypeScript configuration
```

## 3. Dependency direction

The intended dependency direction is:

```text
apps/web
   │
   ├──▶ anchor-utils
   ├──▶ stellar-kit
   ├──▶ validators
   ├──▶ config
   └──▶ types

anchor-utils
   ├──▶ stellar-kit, when Stellar-specific behaviour is required
   ├──▶ fixtures, for backward-compatible re-exported mock/lifecycle fixtures
   ├──▶ validators
   ├──▶ config
   └──▶ types

stellar-kit
   ├──▶ validators
   ├──▶ config
   └──▶ types

fixtures
   └──▶ types

validators
   ├──▶ config, when validation depends on supported environment settings
   └──▶ types

config
   └──▶ types

types
   └──▶ no internal AnchorKit package

tests/integration
   └──▶ all public packages under test
```

`fixtures` is also used as a **test-only** dependency by `validators` and
`stellar-kit` (never from their `src/`) to avoid duplicating sample data
across test suites.

The dependency graph must not point upward.

For example:

- `stellar-kit` must not import `anchor-utils`;
- `validators` must not import `stellar-kit`;
- `types` must not import any other AnchorKit package;
- `fixtures` must not import any other AnchorKit package except `types`;
- no reusable package may import from `apps/web`.

A module should depend only on the lowest-level packages it actually needs.

## 4. Responsibility matrix

| Area                        | Primary responsibility                                                                                          | Permitted internal dependencies                              |
| --------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `packages/types`            | Shared contracts, branded types, enums, result shapes, and event models                                         | None                                                         |
| `packages/config`           | Network presets, endpoints, environment defaults, and mainnet gating                                            | `types`                                                      |
| `packages/fixtures`         | Shared, deterministic test fixtures (accounts, payments, anchors, escrow, diagnostics, invalid examples)        | `types`                                                      |
| `packages/validators`       | Zod schemas, runtime validation, and safe validation errors                                                     | `types`, selected `config` values                            |
| `packages/stellar-kit`      | Stellar keys, accounts, assets, payments, transactions, diagnostics, logging, explorer links, and event parsing | `types`, `config`, `validators`                              |
| `packages/anchor-utils`     | Anchor requests, lifecycle transitions, status messages, badges, and fixtures                                   | `types`, `validators`, `config`, `stellar-kit` when required |
| `apps/web`                  | Routes, forms, React state, page composition, and rendering                                                     | All public packages                                          |
| `examples`                  | Supported and intentionally invalid sample payloads                                                             | Public schemas through tests and scripts                     |
| `tests/integration`         | Cross-package composition through public entry points and deterministic fixtures                                | All public packages under test                               |
| `contracts/treasury-escrow` | On-chain escrow state and authorisation                                                                         | Soroban Rust dependencies                                    |
| `scripts`                   | Repository checks and automation                                                                                | Public packages where appropriate                            |
| `docs`                      | Architecture, security, usage, and contributor guidance                                                         | Repository source as reference                               |

## 5. Package boundaries

### 5.1 `@anchorkit/types`

`packages/types` is the foundation of the TypeScript architecture.

It owns shared definitions such as:

- Stellar public and secret keys;
- transaction hashes;
- network names and configuration shapes;
- native and issued assets;
- payment intents;
- account status and diagnostics;
- anchor request metadata;
- anchor transaction records and statuses;
- milestone and escrow-event models;
- shared error and result shapes.

It must not contain:

- network calls;
- Zod parsing;
- environment-variable reads;
- React components;
- browser storage;
- UI messages;
- anchor or Stellar runtime workflows.

Correct:

```typescript
import type { PaymentIntent, StellarAsset, StellarPublicKey } from "@anchorkit/types";
```

Incorrect:

```typescript
import type { PaymentIntent } from "@anchorkit/types/src/index";
```

Consumers must not import private package source paths.

### 5.2 `@anchorkit/config`

`packages/config` owns shared network and environment configuration.

It includes:

- default network selection;
- Horizon endpoints;
- network passphrases;
- environment-derived defaults;
- testnet-first behaviour;
- explicit mainnet permission;
- network configuration lookup.

It may depend on `types`.

It must not perform:

- Horizon requests;
- transaction construction;
- callback processing;
- React rendering;
- anchor lifecycle transitions.

Changes affecting the following require security review:

- mainnet enablement;
- default network;
- Horizon or Soroban endpoints;
- network passphrases;
- environment fallbacks;
- configuration error behaviour.

### 5.3 `@anchorkit/fixtures`

`packages/fixtures` owns shared, deterministic test fixtures used across
packages instead of each package hand-rolling its own sample data.

It includes:

- funded/unfunded Stellar account fixtures (`accounts.ts`);
- native/issued asset fixtures (`assets.ts`);
- payment intent fixtures, valid and invalid (`payments.ts`);
- anchor deposit/withdrawal request and lifecycle fixtures (`anchors.ts`);
- escrow event and milestone fixtures (`escrow.ts`);
- deterministic `AccountInfo` fixtures for diagnostics tests (`diagnostics.ts`);
- deliberately invalid fixtures for exercising validators (`invalid.ts`).

Fixtures must:

- contain no real secret keys or real user data;
- use fixed, deterministic values (no `Date.now()`, no `Math.random()`);
- mirror the shapes documented in `examples/*.json` where applicable.

It may depend only on `types`. It must not depend on `config`, `validators`,
`stellar-kit`, or `anchor-utils` — this keeps it importable by any package's
test suite without creating cycles.

See [Fixtures](./fixtures.md) for the full module reference.

### 5.4 `@anchorkit/validators`

`packages/validators` owns runtime validation of untrusted input.

It includes schemas and validation helpers for:

- Stellar public keys;
- Stellar secret keys;
- transaction hashes;
- assets;
- amounts;
- memos;
- payment intents;
- anchor deposit metadata;
- anchor withdrawal metadata;
- callback URLs;
- anchor asset configuration;
- milestones and event payloads.

Validators should:

- accept untrusted values as `unknown`;
- return deterministic results;
- avoid network calls;
- avoid leaking secret values in errors;
- produce user-safe validation messages;
- validate before third-party libraries receive data.

Example:

```typescript
import { validateDepositRequest } from "@anchorkit/validators";

const validation = validateDepositRequest(input);

if (!validation.ok) {
  return validation.errors;
}

const metadata = validation.value;
```

Validators must not depend on:

- `stellar-kit`;
- `anchor-utils`;
- `apps/web`.

### 5.5 `@anchorkit/stellar-kit`

`packages/stellar-kit` owns reusable Stellar-specific runtime behaviour.

| Module            | Responsibility                                     |
| ----------------- | -------------------------------------------------- |
| `accounts.ts`     | Account loading and funded-status mapping          |
| `assets.ts`       | Native and issued-asset handling                   |
| `diagnostics.ts`  | Account diagnostics                                |
| `errors.ts`       | Typed Stellar errors                               |
| `escrowEvents.ts` | Soroban escrow-event parsing                       |
| `explorer.ts`     | Stellar Expert and Horizon links                   |
| `intent.ts`       | Payment-intent construction and readiness          |
| `keys.ts`         | Key generation, validation support, and derivation |
| `logging.ts`      | Secret redaction and safe log values               |
| `payments.ts`     | Amount and memo utilities                          |
| `transactions.ts` | Transaction-hash and transaction utilities         |
| `index.ts`        | Public package exports                             |

It may depend on:

- `types`;
- `config`;
- `validators`;
- Stellar SDK dependencies.

It must not depend on:

- `anchor-utils`;
- `apps/web`;
- React components;
- example fixtures as production data.

Network behaviour should be explicit. A function that queries Horizon or another service should make that side effect clear through its name, parameters, documentation, and return type.

Correct:

```typescript
import { buildPaymentIntent, checkTransactionReadiness } from "@anchorkit/stellar-kit";
```

Incorrect:

```typescript
import { buildPaymentIntent } from "../../packages/stellar-kit/src/intent";
```

### 5.6 `@anchorkit/anchor-utils`

`packages/anchor-utils` owns anchor-specific domain behaviour.

It includes:

- deposit request parsing;
- withdrawal request parsing;
- anchor request validation;
- anchor asset configuration helpers;
- payment-rail configuration helpers;
- callback URL helpers;
- lifecycle transitions;
- status-to-message mapping;
- badge metadata;
- mock anchor transaction records;
- anchor lifecycle fixtures.

It should depend mainly on `types` and `validators`.

A dependency on `stellar-kit` is appropriate only where anchor functionality genuinely needs Stellar-specific behaviour, such as:

- interpreting a Stellar transaction;
- generating an explorer link;
- handling a shared Stellar error;
- consuming a parsed contract event.

`anchor-utils` re-exports its lifecycle fixtures and invalid-input fixtures
from `@anchorkit/fixtures` for backward compatibility with existing consumers
(e.g. the `apps/web` anchors page). New fixture data should be added to
`@anchorkit/fixtures` directly rather than to `anchor-utils`.

It must not contain:

- React components;
- Next.js routing;
- browser storage;
- page-level state;
- duplicated generic Stellar utilities.

Correct:

```typescript
import {
  anchorStatusBadge,
  anchorStatusToUserMessage,
  validateAnchorRequest,
} from "@anchorkit/anchor-utils";
```

The package should return plain data. The web app decides how to render it.

## 6. Web application boundary

`apps/web` is the presentation and composition layer.

It owns:

- routes;
- forms;
- React state;
- page-level event handlers;
- navigation;
- Tailwind styling;
- browser-only behaviour;
- rendering package results;
- testnet warnings;
- developer-facing demonstrations.

### Route responsibilities

| Route        | Responsibility                                              | Main packages                         |
| ------------ | ----------------------------------------------------------- | ------------------------------------- |
| `/`          | Landing page and module navigation                          | Presentation only                     |
| `/dashboard` | Toolkit overview                                            | Presentation only                     |
| `/accounts`  | Key generation, key validation, account lookup, diagnostics | `stellar-kit`, `types`                |
| `/payments`  | Payment-intent creation and readiness display               | `stellar-kit`, `config`, `types`      |
| `/anchors`   | Anchor requests and lifecycle demonstration                 | `anchor-utils`, `validators`, `types` |
| `/escrow`    | Escrow-event parsing and milestone display                  | `stellar-kit`, `types`                |
| `/docs`      | Documentation index                                         | Documentation links                   |

### Thin web rule

Keep these concerns in `apps/web`:

- JSX;
- React state;
- Tailwind classes;
- click handlers;
- form controls;
- page routing;
- browser-only APIs.

Move these concerns into packages when reusable:

- validation;
- lifecycle transitions;
- Stellar parsing;
- network configuration;
- error mapping;
- shared types;
- deterministic transformations.

No package may depend on `apps/web`.

## 7. Examples boundary

The `examples` directory is executable documentation.

It contains examples of:

- valid payment intents;
- invalid payment intents;
- native XLM assets;
- issued assets;
- funded accounts;
- unfunded accounts;
- anchor deposit lifecycles;
- anchor withdrawal lifecycles;
- escrow milestones;
- escrow events.

`examples/registry.ts` maps fixtures to the schemas they must satisfy.

```text
JSON fixture
   ↓
examples/registry.ts
   ↓
scripts/check-examples.mts or Vitest
   ↓
@anchorkit/validators
   ↓
pass or expected failure
```

Examples must:

- use synthetic or public testnet data;
- contain no real secret keys;
- match public schemas;
- identify intentionally invalid payloads;
- be registered when included in automated validation.

Production packages must not use example fixtures as runtime configuration or business logic.

## 8. Soroban contract boundary

`contracts/treasury-escrow` is an independent Rust and Soroban execution boundary.

It owns:

- contract initialisation;
- administrator authorisation;
- milestone creation;
- amount assignment;
- evidence-hash submission;
- approval;
- disputes;
- ready-for-release transitions;
- release transitions;
- duplicate-release prevention;
- milestone reads;
- summary reads;
- Soroban event publication.

The contract does not import TypeScript packages.

TypeScript packages do not import Rust source files.

Integration occurs through:

1. deployed contract calls;
2. encoded Soroban arguments and results;
3. emitted contract events;
4. matching conceptual types in `@anchorkit/types`;
5. event parsing in `@anchorkit/stellar-kit`.

```text
External caller
   ↓
Soroban treasury-escrow contract
   ↓
contract state transition and event
   ↓
stellar-kit escrow-event parser
   ↓
typed event from @anchorkit/types
   ↓
apps/web escrow page
```

The web app must not independently reproduce raw Soroban event parsing.

### Contract limitations

The current contract:

- uses a single administrator;
- does not provide complete role-based access control;
- records release as a milestone state transition;
- does not implement full treasury custody;
- does not include complete dispute resolution;
- represents amounts as raw integers.

Higher layers must not hide or misrepresent these limitations.

## 9. Security-sensitive areas

| Area                          | Main risk                                     | Required control                                 |
| ----------------------------- | --------------------------------------------- | ------------------------------------------------ |
| `stellar-kit/keys.ts`         | Secret-key exposure                           | Validate structurally; never log or persist      |
| `stellar-kit/logging.ts`      | Secrets in logs and errors                    | Redact before logging                            |
| `stellar-kit/payments.ts`     | Invalid amounts or memos                      | Validate format and limits                       |
| `stellar-kit/intent.ts`       | Incorrect network or readiness assumptions    | Explicit network and typed readiness             |
| `stellar-kit/transactions.ts` | Invalid hashes or misleading status           | Validate and return typed results                |
| `stellar-kit/accounts.ts`     | Unsafe network calls                          | Use approved configuration and safe errors       |
| `stellar-kit/escrowEvents.ts` | Untrusted contract events                     | Validate version and payload                     |
| `validators`                  | Untrusted input                               | Validate before domain or network use            |
| `config`                      | Accidental mainnet access                     | Testnet-first defaults and explicit override     |
| `anchor-utils`                | Unsafe callbacks or invalid lifecycle changes | URL validation and deterministic transitions     |
| `apps/web/accounts`           | Browser-visible secrets                       | One-time display, password inputs, and redaction |
| `apps/web/payments`           | Confusing readiness with submission           | Clearly distinguish preparation from broadcast   |
| `apps/web/anchors`            | Untrusted callback and action URLs            | Validate before navigation                       |
| `treasury-escrow`             | Unauthorised or premature release             | Authentication and transition checks             |
| `examples`                    | Credential leakage                            | Synthetic or public testnet values only          |

Also review:

- [Security Notes](./SECURITY_NOTES.md)
- [Secret Key Handling](./SECRET_KEY_HANDLING.md)
- [Maintainer Review Checklist](./MAINTAINER_REVIEW_CHECKLIST.md)
- [Security Policy](../SECURITY.md)

## 10. Feature flows

### 10.1 Account diagnostics

```text
Web account form
   ↓
public-key validation
   ↓
stellar-kit account utility
   ↓
config network preset
   ↓
Stellar Horizon
   ↓
typed account result
   ↓
web account display
```

Responsibilities:

- the web app collects input;
- `validators` establishes that the key is structurally valid;
- `config` supplies the network;
- `stellar-kit` performs the request and maps the result;
- `types` defines the shared output.

### 10.2 Payment intent and readiness

```text
Payments form
   ↓
validators
   ↓
stellar-kit payment-intent builder
   ↓
config network setting
   ↓
typed readiness result
   ↓
web readiness display
```

A readiness result is not proof that a transaction was submitted or confirmed.

### 10.3 Anchor request lifecycle

```text
Anchor form
   ↓
anchor-utils request wrapper
   ↓
validators
   ↓
typed anchor request
   ↓
anchor-utils lifecycle transition
   ↓
status message and badge data
   ↓
web rendering
```

Lifecycle rules belong in `anchor-utils`, not in React components.

### 10.4 Escrow event flow

```text
Soroban contract event
   ↓
raw event payload
   ↓
stellar-kit escrow-event parser
   ↓
types event model
   ↓
deterministic summary
   ↓
web escrow page
```

### 10.5 Example validation

```text
examples/*.json
   ↓
examples/registry.ts
   ↓
check-examples script or test
   ↓
validators schema
   ↓
validation result
```

## 11. Correct cross-package integration

### 11.1 Validate a payment intent

```typescript
import { DEFAULT_NETWORK } from "@anchorkit/config";
import { PaymentIntentSchema } from "@anchorkit/validators";
import { buildPaymentIntent } from "@anchorkit/stellar-kit";

const parsed = PaymentIntentSchema.safeParse({
  destination,
  amount,
  asset,
  network: DEFAULT_NETWORK,
});

if (!parsed.success) {
  return {
    ok: false,
    errors: parsed.error.issues,
  };
}

const intent = buildPaymentIntent(parsed.data);
```

Ownership:

- `config` supplies the network;
- `validators` validates the input;
- `stellar-kit` owns Stellar-domain composition;
- the web app decides how errors are displayed.

### 11.2 Render an anchor status

```typescript
import { anchorStatusBadge, anchorStatusToUserMessage } from "@anchorkit/anchor-utils";

const message = anchorStatusToUserMessage(transaction.status, transaction.kind);

const badge = anchorStatusBadge(transaction.status);
```

`anchor-utils` returns plain data. The web application renders that data.

### 11.3 Parse escrow events

```typescript
import { parseEscrowEvents } from "@anchorkit/stellar-kit";
import type { RawEscrowEvent } from "@anchorkit/types";

const events = parseEscrowEvents(rawEvents as RawEscrowEvent[]);
```

The parsing logic belongs in `stellar-kit`, not in a web page.

### 11.4 Use shared types without runtime coupling

```typescript
import type { AnchorTransactionRecord, Milestone } from "@anchorkit/types";

interface EscrowViewModel {
  transaction: AnchorTransactionRecord;
  milestones: Milestone[];
}
```

Use `import type` for type-only dependencies.

## 12. Prohibited integration

The following dependency directions are prohibited:

```text
types → config, validators, stellar-kit, anchor-utils, fixtures, or web
fixtures → config, validators, stellar-kit, anchor-utils, or web
config → validators, stellar-kit, anchor-utils, or web
validators → stellar-kit, anchor-utils, or web
stellar-kit → anchor-utils or web
anchor-utils → web
packages → apps/web
TypeScript packages → Rust source files
production packages → examples fixtures
```

Also prohibited:

- deep imports into another package’s `src` directory;
- duplicating shared public types;
- Horizon calls inside validators;
- environment reads inside `types`;
- lifecycle rules implemented only in React pages;
- React components inside reusable packages;
- storing secret keys in local storage, cookies, or IndexedDB;
- placing secret keys in URLs, logs, or error messages;
- treating sample transactions as confirmed network state.

## 13. Public API rules

Consumers must import from package roots.

Supported:

```typescript
import type { PaymentIntent } from "@anchorkit/types";
import { DEFAULT_NETWORK } from "@anchorkit/config";
import { PaymentIntentSchema } from "@anchorkit/validators";
import { buildPaymentIntent } from "@anchorkit/stellar-kit";
import { validateAnchorRequest } from "@anchorkit/anchor-utils";
```

Unsupported:

```typescript
import { buildPaymentIntent } from "@anchorkit/stellar-kit/src/intent";
import { PaymentIntentSchema } from "../../packages/validators/src";
```

New public APIs must be exported from the owning package’s `src/index.ts`.

## 14. Adding a new feature

Choose the owner using this guide.

| Change                                                      | Correct owner               |
| ----------------------------------------------------------- | --------------------------- |
| Shared public type or event model                           | `types`                     |
| Network endpoint or environment default                     | `config`                    |
| Shared deterministic test fixture                           | `fixtures`                  |
| Runtime schema or validation result                         | `validators`                |
| Account, asset, payment, key, transaction, or event utility | `stellar-kit`               |
| Anchor request, lifecycle, or status behaviour              | `anchor-utils`              |
| React page, component, or browser state                     | `apps/web`                  |
| On-chain escrow rule                                        | `contracts/treasury-escrow` |
| Supported example payload                                   | `examples`                  |
| Contributor or consumer guidance                            | `docs`                      |

For a multi-layer feature, implement from the foundation upward:

```text
types
   ↓
config or validators
   ↓
stellar-kit or anchor-utils
   ↓
apps/web
   ↓
examples and documentation
```

Before adding an import:

1. identify the owning package;
2. confirm the dependency points downward;
3. avoid creating a cycle;
4. use the package’s public entry point;
5. add tests in the owning package;
6. update examples and documentation when public behaviour changes.

## 15. Breaking-change expectations

A change to a package's public surface — anything reachable from its
`@anchorkit/x` root export, per §13 — is **breaking** if it does any of the
following to code that only imports through that public entry point:

- removes or renames an exported function, class, type, or constant;
- changes a function's required parameters (adding a required parameter,
  removing one, or changing a parameter's type incompatibly);
- changes a return type incompatibly (narrowing a union, removing a field
  from a returned object, changing a success/failure shape);
- changes validated-input behaviour so a previously-valid value is now
  rejected, or a previously-rejected value is now accepted;
- changes a previously-thrown error's `code` (see `docs/error-standard.md`)
  for the same failure condition, since callers match on `code`;
- changes default values for `config` (network defaults, endpoints,
  mainnet gating) in a way that alters behaviour for callers who didn't
  override them.

**Not breaking**, even though the diff touches a package:

- adding a new exported function, type, or optional parameter;
- widening an accepted input type or a returned union;
- fixing a validator that incorrectly accepted invalid input, as long as
  it's documented as a bugfix in the changelog (see below) rather than
  shipped silently — a security- or correctness-motivated tightening is
  still a behaviour change callers should be able to find in the log;
  performance improvements that don't change any public signature or
  observable output;
  internal refactors confined to a package's `src/` that never touch its
  `index.ts` re-exports.

Every breaking change must, before merge:

1. bump the affected package's version per semver (`docs/MAINTAINER_GUIDE.md`
   §Releases — this repo is pre-1.0, so a breaking change bumps the minor
   version, per the `0.x` convention);
2. add a changelog entry describing what changed and why;
3. update any example in `examples/` or code sample in `docs/` that used the
   changed surface, so `pnpm check:examples` and `pnpm typecheck` both stay
   green;
4. call out the change explicitly in the PR description — don't rely on a
   reviewer noticing it in a diff.

A change confined to a package's internal modules (anything not re-exported
from its `src/index.ts`) is never breaking for consumers by definition,
since §13 already establishes that only the public entry point is a
supported integration surface.

## 16. Architecture review checklist

Before approving a change, confirm:

- [ ] The feature has one clear owner.
- [ ] Imports follow the permitted dependency direction.
- [ ] No package depends on `apps/web`.
- [ ] No private package source paths are imported.
- [ ] Shared types are not duplicated.
- [ ] Untrusted input is validated before use.
- [ ] Network operations remain in a runtime package.
- [ ] React and Next.js logic remain in `apps/web`.
- [ ] Contract enforcement remains in the Rust contract.
- [ ] Contract events are parsed through `stellar-kit`.
- [ ] Examples are not used as production runtime state.
- [ ] Security-sensitive changes follow the security documentation.
- [ ] Public APIs are exported through package roots.
- [ ] Tests exist in the owning package or contract.
- [ ] Documentation and examples are updated where needed.
- [ ] No circular dependency is introduced.
- [ ] `pnpm check:boundaries` passes.
- [ ] If the change touches a public export, §15's breaking-change criteria
      have been checked and, if breaking, the version/changelog/PR
      description steps there are done.

## 17. Architecture exceptions

An exception to these boundaries requires:

1. a clear technical reason;
2. evidence that no circular dependency is introduced;
3. maintainer approval;
4. tests covering the new interaction;
5. an update to this document.

Convenience alone is not a sufficient reason to reverse dependency direction.

## 18. Related documentation

- [Project Overview](./PROJECT_OVERVIEW.md)
- [End-to-End Developer Journey](./DEVELOPER_JOURNEY.md)
- [Local Setup](./LOCAL_SETUP.md)
- [Account Utilities](./ACCOUNT_UTILITIES.md)
- [Payment Intent Utilities](./PAYMENT_INTENT_UTILITIES.md)
- [Anchor Utilities](./ANCHOR_UTILITIES.md)
- [Validation Engine](./validation-engine.md)
- [Escrow Events](./escrow-events.md)
- [Soroban Escrow Contract](./SOROBAN_ESCROW_CONTRACT.md)
- [Examples](./examples.md)
- [Fixtures](./fixtures.md)
- [Security Notes](./SECURITY_NOTES.md)
- [Secret Key Handling](./SECRET_KEY_HANDLING.md)
- [Contributor Guide](./CONTRIBUTOR_GUIDE.md)
- [Maintainer Guide](./MAINTAINER_GUIDE.md)
- [Maintainer Review Checklist](./MAINTAINER_REVIEW_CHECKLIST.md)
