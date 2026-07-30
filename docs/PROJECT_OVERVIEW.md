# Project Overview

**AnchorKit** is an open-source Stellar developer toolkit maintained under the GitHub organisation
`stellar-commons-labs`. It helps builders create, test, and debug Stellar payment flows, anchor
SEP-style workflows, wallet integrations, and Soroban-based treasury/escrow logic.

This repo is structured as a pnpm + Turborepo monorepo with:

- **`@anchorkit/stellar-kit`** – TypeScript utilities for Stellar accounts, assets, payments,
  memos, transaction hashes, Stellar Expert links, and typed error mapping.
- **`@anchorkit/anchor-utils`** – SEP-style anchor flow helpers: deposit/withdrawal metadata
  parsing, anchor transaction status types and user-facing messages, mock record fixtures and
  lifecycle generators.
- **`@anchorkit/types`, `@anchorkit/config`, `@anchorkit/validators`** – shared types, network
  configuration, and Zod validation schemas.
- **`apps/web`** – a Next.js dashboard that surfaces accounts, payments, anchors, and escrow
  flows with testnet-first warnings.
- **`contracts/treasury-escrow`** – a Rust Soroban smart contract that implements a basic
  community treasury escrow with milestones, evidence, approvals, disputes, and releases.

## Why AnchorKit exists

Most Stellar builders repeatedly re-implement small primitives around keypair validation,
memo sanitisation, payment amount normalisation, asset parsing, Horizon error handling, and
anchor status mapping. AnchorKit packages these primitives as tested, secret-safe, TypeScript
packages and pairs them with a Soroban contract example and a local dashboard that developers
can run against testnet without needing any API keys.

## Design principles

1. **Testnet first.** Mainnet support is configuration-only and explicitly disabled by default.
2. **Secret-safe.** Secret keys are never logged, echoed, or transmitted by the utilities. They
   are redacted in errors, logs, and UI output.
3. **Typed errors.** Stellar SDK / Horizon failures are mapped into typed `StellarKitError`
   values so callers can react programmatically.
4. **SEP-flavoured without over-reach.** Anchor utilities are parsing and fixture helpers, not
   a fully compliant SEP server. A production anchor should build on top.
5. **Contributor friendly.** Monorepo task graph, lint/typecheck/test scripts, issue templates,
   PR template, labels, and a GrantFox workflow are shipped in the MVP.

## Monorepo layout

```
AnchorKit/
├─ apps/
│  └─ web/                         Next.js dashboard (Tailwind CSS, App Router)
├─ packages/
│  ├─ types/                       Shared branded types
│  ├─ config/                      Network + environment config
│  ├─ fixtures/                    Shared deterministic test fixtures
│  ├─ validators/                  Zod validation schemas
│  ├─ stellar-kit/                 Core Stellar utilities + tests
│  └─ anchor-utils/                SEP-style anchor utilities + tests
├─ contracts/
│  └─ treasury-escrow/             Soroban Rust contract + tests
├─ tests/
│  └─ integration/                 Cross-package public-API integration tests
├─ docs/                           All project documentation
├─ examples/                       Seed fixtures and example JSON files
├─ scripts/                        Helper shell / TS scripts
├─ .github/
│  ├─ workflows/                   Automation workflows
│  ├─ ISSUE_TEMPLATE/              Issue templates
│  └─ PULL_REQUEST_TEMPLATE.md
├─ pnpm-workspace.yaml
├─ turbo.json
└─ tsconfig.base.json
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for deeper package boundaries.

See [DEVELOPER_JOURNEY.md](./DEVELOPER_JOURNEY.md) for an end-to-end
walkthrough showing how the modules work together.
