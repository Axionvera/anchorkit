Anchor Utilities
Implemented in packages/anchor-utils/src/index.ts and
packages/anchor-utils/src/fixtures.ts.

Scope
Anchor-utils is a developer helper package, not a fully compliant SEP-6/24/31 server. It
provides:

Parsing and validation for deposit / withdrawal request metadata.
Typed anchor transaction statuses and user-facing message mapping.
Anchor asset and payment-rail configuration validators.
Callback URL validation.
Mock record factories and lifecycle fixtures for unit/integration tests.
Statuses
Status	Semantics
pending_user	Waiting on user action (KYC upload, external transfer confirmation, etc.)
pending_anchor	Anchor is processing the request internally.
pending_stellar	Transaction sent to Stellar, awaiting ledger confirmation.
completed	Flow finished successfully.
failed	Flow failed unrecoverably.
refunded	Funds were returned to the user after a failure.
Helpers:

anchorStatusBadge(status) → { label, tone } – use this for UI badges.
anchorStatusToUserMessage(status, "deposit"|"withdrawal") → { headline, detail, cta, severity }
– use this for user-facing notifications.
advanceAnchorTransactionStatus(status, terminal?) – step through the normal happy path or
jump to a terminal state.
Metadata parsing
TypeScript

parseDepositRequestMetadata(untrustedJsonPayload);
parseWithdrawalRequestMetadata(untrustedJsonPayload);
isDepositRequestValid(obj);
isWithdrawalRequestValid(obj);
Schemas live in @anchorkit/validators and require a valid Stellar account for on-chain
destination/sender, a valid amount, and an asset code ≤ 12 chars. Optional fields: memo,
memoType, railId, clientDomain, emailAddress.

Anchor config validation
TypeScript

validateAnchorAssetConfig({ code, issuer, schema: "stellar", enabled, depositEnabled, ... });
isAnchorAssetConfigValid(obj);
validatePaymentRailConfig({ id, name, kind, currencies, countries, enabled, ... });
isPaymentRailConfigValid(obj);
validateCallbackUrl("https://anchor.example.com/webhook"); // rejects non-HTTPS (except localhost)
Mock records and fixtures
TypeScript

createMockAnchorTransactionRecord({
  kind: "deposit",
  status: "pending_anchor",
  assetCode: "XLM",
  amountIn: "100",
  stellarAccount: myPublicKey,
  message: "Processing the SEPA transfer…",
});
Complete fixtures:

TypeScript

buildDepositLifecycle(); // pending_user → pending_anchor → pending_stellar → completed
buildWithdrawalLifecycle(); // includes failed + refunded states
sampleDepositRequest;
sampleWithdrawalRequest;
Use these in your SEP server unit tests or dashboard demos. Don’t assume exact ids or exact
timestamps — they’re generated fresh on each call.

What anchor-utils does NOT do
No authentication of the anchor client (SEP-10 webauth tokens, JWT).
No KYC fields persistence or status machine.
No submission of Stellar transactions on behalf of the anchor.
No fiat rail integrations (Stripe, Wise, local banks).
Build all of those on top; anchor-utils gives you the typed baseline.

Mock API Contract
For detailed developer specifications, expected payloads, status lookups, and error structures for mock anchor deposit and withdrawal APIs, see the 
Mock Anchor API Contract
.