Capability states
Every module shown on the dashboard has a state describing the readiness of
that dashboard surface. No module should silently appear more complete than
its backing integration.

For the repository-wide matrix, MVP limitations, unsupported features, testnet
assumptions, and planned work, read the
public roadmap and capability disclaimer.

States
implemented — The specifically described capability is present and
tested. This does not by itself mean independently audited, hosted, or ready
for production/mainnet use.
mock — The UI or data shape exists, but the end-to-end flow is backed by
local state, simulation, or fixtures rather than a real integration.
testnet-only — The scoped capability works against Stellar testnet; it
is not supported for mainnet.
experimental — Preview code exists but may change or break without
notice and can be disabled by default.
unavailable — The dashboard module is not built. Its card is disabled
rather than linked to a missing route.
A module can contain lower-level utilities with a different scope. For example,
account diagnostic helpers exist in @anchorkit/stellar-kit, while a standalone
Diagnostics dashboard page is unavailable. Likewise, the Rust escrow contract
exists separately from the mock-only Escrow web page.

Where the dashboard state lives
Type definitions: packages/types/src/index.ts (CapabilityState,
CAPABILITY_STATES, and ModuleCapability).
Registry: packages/config/src/capabilities.ts
(MODULE_CAPABILITIES).
Dashboard rendering: apps/web/app/dashboard/page.tsx, using
CapabilityBadge from apps/web/components/ui.tsx.
Current dashboard module states
Module	State	Description	Docs
Accounts	testnet-only	Creates disposable testnet keys, validates keys locally, and reads testnet Horizon account data.	Roadmap: capability matrix
Payments	mock	Builds and validates payment intents and simulates readiness; it does not construct, sign, or submit transactions.	Roadmap: capability matrix
Anchors	mock	Demonstrates local deposit/withdrawal metadata and fixture-backed SEP-style lifecycles; it is not an SEP server.	Roadmap: capability matrix
Escrow	mock	Steps through an in-memory milestone and fixture events; it does not connect to or deploy the separate Rust contract.	Roadmap: capability matrix
Diagnostics	unavailable	No standalone dashboard route exists; scoped account diagnostics remain available on the Accounts page.	Roadmap: capability matrix
Network configuration	unavailable	Network presets exist in the config package, but no standalone dashboard route or switching workflow exists.	Roadmap: capability matrix
The registry in packages/config/src/capabilities.ts is authoritative for
dashboard cards. The roadmap is authoritative for broader package, contract,
support, and future-delivery boundaries.

Updating a module
Add a new module id to CapabilityModuleId in
packages/types/src/index.ts, if needed.
Add or update its MODULE_CAPABILITIES entry in
packages/config/src/capabilities.ts.
Add or update assertions in
packages/config/test/capabilities.test.ts.
Update the table above and the broader matrix in
ROADMAP.md.
Verify that mock/unavailable modules cannot link to a missing or live-looking
workflow and run lint, typecheck, tests, and build.