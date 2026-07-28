Public roadmap and capability disclaimer
Project status: AnchorKit v0.1.x is a developer preview and reference
implementation. It is testnet-first, has not been independently audited, and
is not a production payment, anchor, custody, or treasury product. Do not use
it to manage real funds or mainnet secrets.

This document is the public source of truth for the scope and readiness of the
repository. It describes capabilities present in the source tree; it does not
promise a hosted service, a supported deployment, or delivery dates for planned
work.

The evidence-based SECURITY_ARCHITECTURE_REVIEW.md
is the companion security assessment. Its current verdict—appropriate for
testnet development, but not production custody, mainnet value, or unattended
treasury operation—is consistent with this roadmap. If the documents ever
disagree, follow the more restrictive statement until both are updated.

How to read capability states
State	Meaning
Implemented	The narrowly described local API or utility exists and is tested. This label does not by itself mean audited, hosted, or production-ready.
Testnet-only	The capability can use Stellar testnet under the documented assumptions. Mainnet use is not supported.
Mock-only	The shape or user flow exists, but results come from local state, simulations, or fixtures rather than an end-to-end integration.
Experimental	Prototype code exists, but its API or behaviour may change or be removed without notice. It is disabled by default when a feature flag exists.
Unavailable	The capability is not currently provided, even if a route, type, endpoint preset, or future-facing stub mentions it.
Planned	The item is a roadmap intention, not a commitment or release guarantee.
The dashboard's shorter module-level state list lives in
CAPABILITY_STATES.md. A feature flag, network
configuration value, example payload, or source file is not evidence that an
end-to-end capability is live.

Current capability matrix
This snapshot covers the v0.1.x source in this repository.

Area	Current state	What works now	Important boundary
Shared types and validators	Implemented	Branded TypeScript models and Zod validation for keys, assets, payment intents, anchor metadata, receipts, milestones, and escrow events.	These are local data contracts and validators, not network integrations or protocol compliance certification.
Network configuration and safety	Implemented	Testnet, mainnet, and futurenet presets; testnet is the default; Horizon account calls reject mainnet unless allowMainnet: true is explicitly supplied.	A mainnet endpoint preset or bypassing the default guard does not make AnchorKit audited or mainnet-supported.
Fixtures and JSON examples	Mock-only	Deterministic account, payment, anchor, diagnostics, receipt, and escrow samples for tests and demos.	Values are not live network records, supported deployment IDs, private keys, or proof of an integration.
Account and key utilities	Testnet-only	Local key generation and validation, secret redaction, Friendbot links, Stellar Expert links, Horizon account reads, balance modelling, and account diagnostics.	The web page makes read-only testnet Horizon calls. It has no wallet, custody, durable key storage, signing, or transaction submission.
Asset helpers and registry	Testnet-only	Native/issued asset parsing and validation plus a small static testnet registry and local registry UI.	There is no authoritative asset discovery, issuer due diligence, pricing, liquidity, or mainnet asset registry.
Payment intent and readiness utilities	Mock-only end-to-end	Local intent, amount, memo, asset, balance, and readiness checks exist; optional account diagnostics can read Horizon. The web page simulates account states.	AnchorKit does not construct, sign, fee-bump, or submit a real payment transaction. A “ready” result is advisory, not a guarantee that a transaction will succeed.
Anchor utilities and web flow	Mock-only	SEP-style metadata parsing, configuration validation, lifecycle transitions, status messages, and deterministic deposit/withdrawal records.	There is no SEP-6/10/12/24/31 server, authentication service, KYC flow, quote service, callback processor, or real anchor connection.
Receipts, explorer links, and escrow event parsing	Implemented (local parsing only)	Typed receipt normalisation, link generation, and parsing of supplied event payloads.	There is no transaction watcher, Soroban event indexer, webhook delivery service, or confirmation guarantee. Demo receipts may be fixture-derived.
Escrow dashboard	Mock-only	An in-memory milestone step-through and fixture-backed event/receipt display.	It does not call Soroban RPC, deploy a contract, mutate on-chain state, or move tokens. Refreshing the page loses UI state.
Treasury escrow Rust contract	Experimental	A locally testable Soroban milestone state machine with admin auth, evidence, approval, dispute, release-state recording, summaries, and events.	It is not independently audited and no supported deployment is shipped. “Release” changes state and emits an event; it transfers no asset. It is single-admin, has no beneficiary/arbiter roles, and disputes are terminal.
Diagnostics module	Testnet-only library; unavailable standalone UI	Account/config diagnostic helpers are exported and account diagnostics appear on the Accounts page.	There is no /diagnostics route or general network monitoring service.
Network configuration module	Unavailable standalone UI	Network presets and safety helpers exist in @anchorkit/config.	There is no /network-config route or supported dashboard network-switching workflow.
Soroban and vault SDK prototypes	Experimental placeholders	Feature-flagged diagnostic/placeholder functions are exported from @anchorkit/stellar-kit and disabled by default.	They perform no Soroban RPC, deployment, contract invocation, secret management, or vault operation. Enabling a flag changes the placeholder result only; it does not create a working integration.
Package distribution	Unavailable	Workspace packages build locally from the monorepo.	No npm release, stable public API guarantee, or formal deprecation/upgrade policy is provided in v0.1.x.
Web dashboard as a whole	Experimental developer UI	Local pages demonstrate accounts, assets, payments, anchors, escrow models, and documentation pointers.	It has no production backend, durable database, authentication, access control, operational monitoring, or service-level objective.
MVP limitations
The dashboard is a local developer aid. Most state is held in React memory or
loaded from deterministic fixtures and is lost on refresh.
Only account lookup/diagnostics currently make a live network read, through
Horizon. The other primary dashboard flows are local validation or demos.
Payment readiness is preflight guidance. It is not transaction construction,
simulation by Stellar Core, signing, submission, or finality tracking.
The anchor package models selected SEP-style fields and statuses; it is not a
complete or certified implementation of any Stellar Ecosystem Proposal.
The escrow contract is milestone bookkeeping. Amounts are accounting values;
the contract neither holds nor transfers tokens.
No verified contract address, deployment manifest, hosted API, or production
environment is distributed with this repository.
Packages are versioned 0.1.x; APIs and data models may change before a
stable release.
Tests reduce regression risk but do not replace protocol review, integration
testing, an independent security audit, or operational controls.
Explicitly unsupported in v0.1.x
The following must be treated as unsupported, not merely hidden:

production or mainnet use, production uptime, and financial-loss guarantees;
custody, secure secret storage, wallet connection, hardware-wallet support,
transaction signing, fee bumping, multisig coordination, and submission;
real deposits, withdrawals, swaps, payouts, liquidity, or fiat payment rails;
a production SEP server, web authentication, KYC/AML, sanctions checks,
quotes, customer files, callback delivery, or webhook signature verification;
Soroban RPC integration, automated contract deployment, contract upgrade
orchestration, event indexing, and on-chain token movement;
escrow beneficiaries, arbiter roles, multi-admin governance, admin rotation,
dispute resolution, and recovery from a lost admin key;
durable databases, user accounts, sessions, role-based access, background
jobs, observability, backups, and disaster recovery;
authoritative asset listings, issuer verification, prices, liquidity data, or
investment/risk advice; and
a hosted AnchorKit service or a support/SLA commitment.
Testnet assumptions
Testnet is the default, not a production-equivalent environment.
DEFAULT_NETWORK is testnet and DEFAULT_ENV_CONFIG.allowMainnet is
false.
Public services are external dependencies. Testnet Horizon, Friendbot,
Soroban RPC, and explorer services may be unavailable, rate-limited, reset,
or return data that later disappears. AnchorKit does not operate them.
Test assets have no real-world value. Testnet XLM, issued assets, sample
accounts, hashes, and contract IDs must not be interpreted as mainnet assets
or endorsed issuers.
Generated keys are disposable test identities. The dashboard has no
secure vault or recovery mechanism. Never paste or reuse a mainnet secret.
Mainnet opt-in is only a guard override. Passing an environment config
with allowMainnet: true can permit supported Horizon-read code paths to use
a mainnet preset; it does not enable a production safety posture or any
transaction-submission capability.
Soroban deployment is user-operated. Build/deploy commands in the docs
are examples. The repository does not attest that a contract is currently
deployed or supported at any particular address.
Integrators own end-to-end validation. Trustlines, reserves, sequence
numbers, fees, issuer policy, compliance, and final transaction results must
be checked at execution time by the integrating application.
See STELLAR_TESTNET_USAGE.md for endpoints and
usage details, and SECURITY_NOTES.md before adapting any
code for a live system.

Roadmap
Roadmap entries are directional and have no guaranteed dates. Security and
correctness work can reorder or remove them.

v0.1.x — current developer preview
Monorepo foundations, shared types, validators, network safety configuration,
deterministic fixtures, and package tests.
Testnet account reads and local account/key/asset/payment utilities.
Mock anchor and escrow dashboard flows.
Experimental Soroban milestone-state contract with local Rust tests.
Capability badges, safety documentation, contributor guidance, and examples.
v0.2 — proposed testnet integration layer
Add SEP-10-style web-auth client validation helpers (not a server).
Add explicit testnet transaction construction and submission adapters with
opt-in safety gates, deterministic tests, and clear signing boundaries.
Add a typed, read-only Soroban RPC client and reproducible testnet deployment
notes for the treasury contract.
Add opt-in local persistence for dashboard demos.
Add standalone diagnostics/network-configuration pages only when their routes
and behaviour are implemented.
Make anchor status messages ready for localisation.
v0.3 — proposed integration examples
Add grant payout/batch-release examples and auditable CSV export.
Add an anchor transaction-record storage abstraction with JSON and Postgres
adapters; this would still not be a production SEP server.
Extend the escrow design with explicit parties, role-based administration,
dispute resolution, token integration, and upgrade/migration tests.
Add verified callback/webhook signatures and replay protection.
v1.0 candidate — requires release gates
Publish versioned @anchorkit/* packages with a changelog, migration policy,
and documented compatibility guarantees.
Add a wallet-adapter abstraction only after secret/signing boundaries receive
dedicated security review.
Add a minimal SEP-24 reference service with an explicit compliance and
production-hardening disclaimer.
Consider mainnet-capable paths only after the release gates below are met.
Gates before any production or mainnet claim
A future roadmap label alone cannot make a capability production-ready. At a
minimum, the relevant area must have:

end-to-end tests against the supported network and failure modes;
a documented threat model, trust model, and operational runbook;
secure signing/key-management boundaries with no demo secrets;
independent security review or audit appropriate to the funds at risk;
versioned releases, migration guidance, monitoring, and rollback plans; and
an explicit maintainer announcement changing its status in this document and
the dashboard capability registry.
Keeping this document accurate
When capability scope changes, update all applicable sources in the same pull
request:

this roadmap and disclaimer;
CAPABILITY_STATES.md;
packages/config/src/capabilities.ts for dashboard modules;
relevant package and feature documentation; and
README or web warnings if a user-visible safety boundary changed.
If code and documentation disagree, use the more restrictive interpretation
until the discrepancy is reviewed and corrected.