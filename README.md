AnchorKit
Open-source Stellar developer toolkit for builders working with Stellar wallets, anchors, payment rails, SEP flows, and Soroban-based treasury logic.

AnchorKit is a seriously-built pnpm + Turborepo monorepo for the Stellar
ecosystem. It ships reusable TypeScript utilities, a testnet-first developer
dashboard, a Rust Soroban treasury escrow example contract, comprehensive
documentation, and a GrantFox-ready contribution structure.

text

org:  stellar-commons-labs
repo: anchorkit
mvp:  0.1.x (testnet-only by default)
⚠️ Project status and capability disclaimer
AnchorKit v0.1.x is a developer preview, not a production or mainnet-ready
financial system. It has not been independently audited and must not be used
to custody or move real funds.

The Accounts page performs read-only testnet Horizon lookups; the Payments,
Anchors, and Escrow dashboard flows are local simulations or fixture-backed
demos.
AnchorKit does not construct, sign, or submit payments in the MVP.
The Rust escrow contract is an experimental state-machine example. Its
release operation records state and emits an event; it does not transfer
tokens, and this repository does not ship a supported deployment.
A feature flag, endpoint preset, example, or source file does not mean an
end-to-end integration is live.
Read the public roadmap and full capability disclaimer
for the current capability table, mock and experimental areas, unsupported
features, MVP limitations, testnet assumptions, and planned work.

<<<<<<< HEAD
✨ Features shipped in MVP
@anchorkit/stellar-kit
Keypair generation for testnet
Public / secret key validation without logging secrets
Load account details from Stellar Horizon testnet
Funded / unfunded / unknown / error status mapping
Asset parsing + validation (native + issued)
Safe amount + memo validation (7 decimals, 28-byte text, 64-hex hash)
Payment intent builders & synchronous + asynchronous transaction readiness
Typed Stellar errors with Horizon error mapping + secret redaction
Transaction hash parsing + Stellar Expert + Horizon link generators
@anchorkit/anchor-utils
Deposit / withdrawal SEP-style metadata parsers (Zod)
Anchor transaction statuses: pending_user, pending_anchor, pending_stellar,
completed, failed, refunded
User-facing status headline/detail mapping
Anchor asset + payment-rail configuration validators
Callback URL validators (HTTPS required in prod, localhost allowed)
Mock transaction record factories + deposit/withdrawal lifecycle fixtures
contracts/treasury-escrow (Soroban / Rust)
Initialise escrow with admin
Create / assign amount / submit evidence hash / approve / dispute /
mark ready / release milestones
Milestone status DAG: draft → active → evidence_submitted → approved → ready_for_release → released
with a disputed branch that blocks further approval
Enforce admin-only actions; prevent double-release; prevent release before
approval; validate milestone IDs
Events for evidence, approval, dispute, ready-for-release, and release-state recording
No token custody or transfer; “release” updates bookkeeping state and emits an event
Rust tests covering all of the above plus summary aggregations
apps/web (Next.js 14 App Router, Tailwind)
/ landing + module cards
/dashboard module overview + testnet warnings
/accounts keypair generator, pubkey/secret validator (redacted), funded status lookup, Stellar Expert links
/payments payment intent builder with field-level validation + readiness warnings
/anchors mock deposit/withdrawal creation, config validation, status lifecycle badges
/escrow Soroban treasury milestone step-through UI + contract links
/docs docs index + quickstart
Documentation (under docs/)
Project overview, local setup, architecture, testnet usage
Security notes + secret-key handling rules (R0–R6)
Account utilities, payment intent utilities, anchor utilities, Soroban escrow contract
Contributor guide, maintainer guide, issue writing guide
Advanced GrantFox issue standard, GrantFox workflow, maintainer review checklist
Roadmap through v1.0
GitHub / CI
Workflows: install, lint, typecheck, test, build, rust-contract-tests
Issue templates: Bug Report, Feature/Enhancement, GrantFox Campaign Issue, Documentation
PR template covering issue reference, affected packages/apps, testing performed,
screenshots, security impact, documentation impact, and a maintainer self-check checklist
Labels manifest including GrantFox OSS, Maybe Rewarded, Official Campaign | FWC26, stellar, soroban, anchor, sep, wallet, payments, escrow, security, test, documentation, good first issue, expert
Seed examples/ fixtures and helper scripts/
📦 Repository structure
text
=======
- **`@anchorkit/stellar-kit`**
  - Keypair generation for testnet
  - Public / secret key validation without logging secrets
  - Load account details from Stellar Horizon testnet
  - Funded / unfunded / unknown / error status mapping
  - Asset parsing + validation (native + issued)
  - Safe amount + memo validation (7 decimals, 28-byte text, 64-hex hash)
  - Payment intent builders & synchronous + asynchronous transaction readiness
  - Typed Stellar errors with Horizon error mapping + secret redaction
  - Transaction hash parsing + Stellar Expert + Horizon link generators
- **`@anchorkit/anchor-utils`**
  - Deposit / withdrawal SEP-style metadata parsers (Zod)
  - Anchor transaction statuses: `pending_user`, `pending_anchor`, `pending_stellar`,
    `completed`, `failed`, `refunded`
  - User-facing status headline/detail mapping
  - Anchor asset + payment-rail configuration validators
  - Callback URL validators (HTTPS required in prod, localhost allowed)
  - Mock transaction record factories + deposit/withdrawal lifecycle fixtures
- **`contracts/treasury-escrow` (Soroban / Rust)**
  - Initialise escrow with admin
  - Create / assign amount / submit evidence hash / approve / dispute /
    mark ready / release milestones
  - Milestone status DAG: `draft → active → evidence_submitted → approved → ready_for_release → released`
    with a `disputed` branch that blocks further approval
  - Enforce admin-only actions; prevent double-release; prevent release before
    approval; validate milestone IDs
  - Events for evidence, approval, dispute, ready-for-release, release
  - Rust tests covering all of the above plus summary aggregations
- **`apps/web`** (Next.js 14 App Router, Tailwind)
  - `/` landing + module cards
  - `/dashboard` module overview + testnet warnings
  - `/accounts` keypair generator, pubkey/secret validator (redacted), funded status lookup, Stellar Expert links
  - `/payments` payment intent builder with field-level validation + readiness warnings
  - `/anchors` mock deposit/withdrawal creation, config validation, status lifecycle badges
  - `/escrow` Soroban treasury milestone step-through UI + contract links
  - `/docs` docs index + quickstart
- **Documentation** (under `docs/`)
  - Project overview, local setup, architecture, testnet usage
  - Security notes + secret-key handling rules (R0–R6)
  - Account utilities, payment intent utilities, anchor utilities, Soroban escrow contract
  - Contributor guide, maintainer guide, issue writing guide
  - Advanced GrantFox issue standard, GrantFox workflow, maintainer review checklist
  - Roadmap through v1.0
- **GitHub / CI**
  - Workflows: install, lint, typecheck, test, build, rust-contract-tests
  - Issue templates: Bug Report, Feature/Enhancement, GrantFox Campaign Issue, Documentation
  - PR template covering issue reference, affected packages/apps, testing performed,
    screenshots, security impact, documentation impact, and a maintainer self-check checklist
  - Labels manifest including GrantFox OSS, Maybe Rewarded, Official Campaign | FWC26, stellar, soroban, anchor, sep, wallet, payments, escrow, security, test, documentation, good first issue, expert
  - Seed `examples/` fixtures and helper `scripts/`
>>>>>>> upstream/main

AnchorKit/
├─ apps/
│  └─ web/                         Next.js 14 dashboard (Tailwind, App Router)
├─ packages/
│  ├─ types/                       Branded shared types
│  ├─ config/                      Network presets + env defaults
│  ├─ fixtures/                    Shared deterministic test fixtures (no real secrets)
│  ├─ validators/                  Zod validation schemas
│  ├─ stellar-kit/                 Core Stellar utilities + Vitest tests
│  └─ anchor-utils/                SEP-style anchor utilities + Vitest tests
├─ contracts/
│  └─ treasury-escrow/             Soroban Rust contract (cargo test clippy build)
├─ docs/                           All project documentation (see § Docs index below)
├─ examples/                       Seed JSON fixtures
├─ scripts/                        Helper shell scripts
├─ .github/
│  ├─ workflows/                   install / lint / typecheck / test / build / rust-contract-tests
│  ├─ ISSUE_TEMPLATE/              bug / feature / GrantFox / docs
│  ├─ PULL_REQUEST_TEMPLATE.md
│  └─ LABELS.yml
├─ package.json                    root scripts + devDependencies
├─ pnpm-workspace.yaml             apps/* packages/* contracts/*
├─ turbo.json
├─ tsconfig.base.json
└─ README.md / LICENCE / CODE_OF_CONDUCT.md / SECURITY.md / CONTRIBUTING.md
🚀 Quick start
Prerequisites
Tool	Min	Notes
Node.js	20.x	Required for all packages + web
pnpm	9.x	Required package manager; install via npm i -g pnpm@9 if needed
Rust (optional)	1.81+	Only for contracts/treasury-escrow tests and builds; needs wasm32-unknown-unknown target + clippy
Install and run
Clone and install dependencies:

Bash

git clone git@github.com:stellar-commons-labs/anchorkit.git
cd anchorkit
pnpm install
Start the developer dashboard at http://localhost:3000:

Bash

pnpm web:dev
Run all TypeScript unit tests:

Bash

<<<<<<< HEAD
pnpm test
Run lint, typecheck, and build the full monorepo:
=======
Run the single local verification command (format, lint, typecheck, test, build):

```bash
pnpm verify
```

See [docs/LOCAL_VERIFICATION.md](./docs/LOCAL_VERIFICATION.md) for details and the optional
`pnpm verify:full` variant (examples, package boundaries, Soroban contract tests).

Run lint, typecheck, and build individually if needed:
>>>>>>> upstream/main

Bash

pnpm lint
pnpm typecheck
pnpm build
Run the Soroban treasury-escrow contract tests (Rust toolchain required):

Bash

pnpm contract:test
🛡️ Important safety defaults
AnchorKit is testnet-first and secret-safe by design:

<<<<<<< HEAD
No mainnet by default. DEFAULT_ENV_CONFIG.allowMainnet = false. Any
attempt to reach mainnet Horizon — via loadAccount, getAccountStatus,
diagnoseAccount, or payment-readiness checks — without an explicit
allowMainnet: true env override throws a typed MAINNET_DISABLED error
before any network call is made. (Soroban RPC access is not yet
implemented in the toolkit, so there is nothing to gate there yet.)
Secret keys are redacted everywhere. Logs, errors, UI, and even many
internal code paths use secretKeyToRedactedString(...) / redactSecrets(str).
See docs/SECRET_KEY_HANDLING.md for the R0–R6
rules enforced on every PR.
No custody of user funds. Nothing in the MVP stores, signs with, or
otherwise manages real private keys on user behalf.
No real payment submission by default. The Payments page composes a
payment intent and shows a readiness report; it does not broadcast a
transaction to the network out of the box.
📚 Docs index
All of these live under ./docs/.
=======
1. **No mainnet by default.** `DEFAULT_ENV_CONFIG.allowMainnet = false`. Any
   attempt to reach mainnet Horizon — via `loadAccount`, `getAccountStatus`,
   `diagnoseAccount`, or payment-readiness checks — without an explicit
   `allowMainnet: true` env override throws a typed `MAINNET_DISABLED` error
   before any network call is made. (Soroban RPC access is not yet
   implemented in the toolkit, so there is nothing to gate there yet.)
2. **Secret keys are redacted everywhere.** Logs, errors, UI, and even many
   internal code paths use `secretKeyToRedactedString(...)` / `redactSecrets(str)`.
   See [docs/SECRET_KEY_HANDLING.md](./docs/SECRET_KEY_HANDLING.md) for the R0–R6
   rules enforced on every PR.
3. **No custody of user funds.** Nothing in the MVP stores, signs with, or
   otherwise manages real private keys on user behalf.
4. **No real payment submission by default.** The Payments page composes a
   payment intent and shows a readiness report; it does **not** broadcast a
   transaction to the network out of the box.

## 📚 Docs index

All of these live under [`./docs/`](./docs/).

| Topic                                    | File                                                                        |
| ---------------------------------------- | --------------------------------------------------------------------------- |
| Project overview                         | [`PROJECT_OVERVIEW.md`](./docs/PROJECT_OVERVIEW.md)                         |
| End-to-end developer journey             | [`DEVELOPER_JOURNEY.md`](./docs/DEVELOPER_JOURNEY.md)                       |
| Local setup                              | [`LOCAL_SETUP.md`](./docs/LOCAL_SETUP.md)                                   |
| Local verification (`pnpm verify`)       | [`LOCAL_VERIFICATION.md`](./docs/LOCAL_VERIFICATION.md)                     |
| Architecture / package boundaries        | [`ARCHITECTURE.md`](./docs/ARCHITECTURE.md)                                 |
| Stellar testnet usage                    | [`STELLAR_TESTNET_USAGE.md`](./docs/STELLAR_TESTNET_USAGE.md)               |
| Security notes                           | [`SECURITY_NOTES.md`](./docs/SECURITY_NOTES.md)                             |
| Security threat model                    | [`SECURITY_THREAT_MODEL.md`](./docs/SECURITY_THREAT_MODEL.md)               |
| Security & architecture readiness review | [`SECURITY_ARCHITECTURE_REVIEW.md`](./docs/SECURITY_ARCHITECTURE_REVIEW.md) |
| Secret key handling rules R0–R6          | [`SECRET_KEY_HANDLING.md`](./docs/SECRET_KEY_HANDLING.md)                   |
| Account utilities                        | [`ACCOUNT_UTILITIES.md`](./docs/ACCOUNT_UTILITIES.md)                       |
| Payment intent utilities                 | [`PAYMENT_INTENT_UTILITIES.md`](./docs/PAYMENT_INTENT_UTILITIES.md)         |
| Anchor utilities                         | [`ANCHOR_UTILITIES.md`](./docs/ANCHOR_UTILITIES.md)                         |
| Soroban treasury escrow contract         | [`SOROBAN_ESCROW_CONTRACT.md`](./docs/SOROBAN_ESCROW_CONTRACT.md)           |
| Shared error taxonomy                    | [`ERROR_TAXONOMY.md`](./docs/ERROR_TAXONOMY.md)                             |
| Escrow storage migration guide           | [`ESCROW_MIGRATION.md`](./docs/ESCROW_MIGRATION.md)                         |
| Shared test fixtures                     | [`FIXTURE_FRAMEWORK.md`](./docs/FIXTURE_FRAMEWORK.md)                       |
| Status severity mapping                  | [`STATUS_SEVERITY_MAPPING.md`](./docs/STATUS_SEVERITY_MAPPING.md)           |
| Contributor guide                        | [`CONTRIBUTOR_GUIDE.md`](./docs/CONTRIBUTOR_GUIDE.md)                       |
| Maintainer guide                         | [`MAINTAINER_GUIDE.md`](./docs/MAINTAINER_GUIDE.md)                         |
| Issue writing guide                      | [`ISSUE_WRITING_GUIDE.md`](./docs/ISSUE_WRITING_GUIDE.md)                   |
| GrantFox contribution workflow           | [`GRANTFOX_WORKFLOW.md`](./docs/GRANTFOX_WORKFLOW.md)                       |
| Advanced issue standard                  | [`ISSUE_STANDARD.md`](./docs/ISSUE_STANDARD.md)                             |
| Maintainer review checklist              | [`MAINTAINER_REVIEW_CHECKLIST.md`](./docs/MAINTAINER_REVIEW_CHECKLIST.md)   |
| Automation runbook                       | [`AUTOMATION_RUNBOOK.md`](./docs/AUTOMATION_RUNBOOK.md)                     |
| Roadmap                                  | [`ROADMAP.md`](./docs/ROADMAP.md)                                           |

## 🦊 GrantFox readiness
>>>>>>> upstream/main

Topic	File
Project overview	PROJECT_OVERVIEW.md
End-to-end developer journey	DEVELOPER_JOURNEY.md
Local setup	LOCAL_SETUP.md
Architecture / package boundaries	ARCHITECTURE.md
Stellar testnet usage	STELLAR_TESTNET_USAGE.md
Security notes	SECURITY_NOTES.md
Security threat model	SECURITY_THREAT_MODEL.md
Security & architecture readiness review	SECURITY_ARCHITECTURE_REVIEW.md
Secret key handling rules R0–R6	SECRET_KEY_HANDLING.md
Account utilities	ACCOUNT_UTILITIES.md
Payment intent utilities	PAYMENT_INTENT_UTILITIES.md
Anchor utilities	ANCHOR_UTILITIES.md
Soroban treasury escrow contract	SOROBAN_ESCROW_CONTRACT.md
Shared error taxonomy	ERROR_TAXONOMY.md
Escrow storage migration guide	ESCROW_MIGRATION.md
Shared test fixtures	FIXTURE_FRAMEWORK.md
Status severity mapping	STATUS_SEVERITY_MAPPING.md
Contributor guide	CONTRIBUTOR_GUIDE.md
Maintainer guide	MAINTAINER_GUIDE.md
Issue writing guide	ISSUE_WRITING_GUIDE.md
GrantFox contribution workflow	GRANTFOX_WORKFLOW.md
Advanced issue standard	ISSUE_STANDARD.md
Maintainer review checklist	MAINTAINER_REVIEW_CHECKLIST.md
Automation runbook	AUTOMATION_RUNBOOK.md
Dashboard capability states	CAPABILITY_STATES.md
Public roadmap & capability disclaimer	ROADMAP.md
🦊 GrantFox readiness
AnchorKit was designed from the start to be a high-quality target for GrantFox
OSS campaigns. The following contribute towards reward-readiness on issues
carrying the GrantFox OSS + Maybe Rewarded + Official Campaign | FWC26 labels:

Detailed, scoped issue templates (.github/ISSUE_TEMPLATE/grantfox_issue.md +
docs/ISSUE_STANDARD.md).
A written contributor flow: docs/GRANTFOX_WORKFLOW.md.
A pre-merge review checklist every PR must pass:
docs/MAINTAINER_REVIEW_CHECKLIST.md.
A labels manifest covering Stellar ecosystem taxonomy plus the campaign
labels: see .github/LABELS.yml.
💬 Community
Stellar developers: visit developers.stellar.org and the
Stellar Discord for general questions.
AnchorKit-specific questions: file an issue using the templates in
.github/ISSUE_TEMPLATE/.
Code of conduct: CODE_OF_CONDUCT.md.
Private security disclosures: SECURITY.md.
⚖️ Licence
AnchorKit source code is released under the Apache 2.0 licence. See
LICENCE for the full text.