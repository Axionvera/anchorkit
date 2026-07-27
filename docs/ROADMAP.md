# Roadmap

MVP 0.1 (shipped in this repo)
---
- Monorepo with pnpm + Turborepo, typed TS packages, ESLint + Prettier + Vitest.
- `@anchorkit/stellar-kit`: keypair, pubkey/seckey validation, asset parsing, amount/memo
  validation, payment intent readiness, tx hash validation, Stellar Expert links, typed
  Horizon error mapping with secret redaction.
- `@anchorkit/anchor-utils`: deposit/withdrawal metadata parsers, anchor status types and
  user messages, callback URL validation, mock record + lifecycle fixtures.
- `contracts/treasury-escrow` Soroban MVP: create milestone → evidence → approve / dispute →
  ready → release with events, admin-only gates, duplicate-release and dispute-approval
  guards, Rust tests.
- Next.js dashboard pages: `/`, `/dashboard`, `/accounts`, `/payments`, `/anchors`,
  `/escrow`, `/docs`.
- Docs: overview, setup, architecture, testnet usage, security notes, secret handling rules,
  package reference docs, contributor + maintainer guides, issue-writing guidance, GrantFox
  workflow + issue standard + review checklist, roadmap.
- GitHub: issue templates, PR template, workflows for install/lint/typecheck/test/build/
  contract tests, labels list.
- Seed examples/fixtures for all main flows.

MVP 0.2
---
- Add SEP-10 style web-auth client helper utility + validator in anchor-utils (no server).
- Add Stellar classic `Transaction` builder in stellar-kit for testnet-only mock submission.
- Add a simple contract client in TS for the treasury escrow (read-only + demo deploy notes).
- Add a SQLite-backed local persistence layer behind an opt-in flag in the web app.
- Add i18n-ready anchor status message dictionary.

v0.3 (pre-1.0)
---
- Grant payouts example: batch release + release logs exported as CSV.
- Anchor transaction record store abstraction (Postgres + JSON), not a production SEP server
  but a strong base to build one.
- Contract upgrade: `resolve_dispute(...)` call, multi-admin / role-based access, decimals +
  token asset integration so release actually moves tokens.
- Webhook signature verification for callback URLs in anchor-utils.

v1.0
---
- Audited, safe mainnet paths behind feature flags.
- SEP-24 interactive flow minimal reference server.
- Wallet adapter abstraction (Freighter, xBull, Lobstr) in a new `@anchorkit/wallet-adapters`
  package.
- Formal CHANGELOG, semver releases published to npm under `@anchorkit/*` scope.
