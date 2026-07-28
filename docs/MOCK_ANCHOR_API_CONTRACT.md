Mock Anchor API Contract Documentation
This document defines the mock API contract for AnchorKit's anchor lifecycle examples (issue #5). This contract serves as a developer utility to design, mock, and test wallet and client applications interacting with anchor services without requiring full SEP-6/24/31 production servers.

[!IMPORTANT]
This remains a mock developer utility and does not claim production SEP compliance. It does not handle JWT-based authentication (SEP-10), on-chain asset minting, KYC verification persistence, or real fiat transaction rails.

Architecture Overview
In a typical developer flow, a client wallet or application:

Initiates a deposit or withdrawal request via mock API.
Receives an initial transaction record (pending_user status) with transaction instructions.
Polls or retrieves the transaction status via status lookup.
Steps through or simulates the transaction lifecycle (simulating background anchor processes) via mock lifecycle updates.
Handles standard API error formats for schema validation failures or illegal transition attempts.
1. Endpoints & Payloads
1.1 Deposit Creation
Initiates a deposit flow where a user sends off-chain fiat/funds to the anchor, and the anchor mocks sending the equivalent Stellar asset to the user's account.

Endpoint: POST /api/anchor/deposit
Request Payload (AnchorMockDepositRequest / DepositRequestMetadata):
JSON

{
  "assetCode": "XLM",
  "amount": "500.0000000",
  "account": "GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR",
  "memo": "AnchorTest-42",
  "memoType": "text",
  "railId": "sepa_eur_bank",
  "emailAddress": "tester+sep@example.com",
  "type": "SEPA"
}
Response Payload (AnchorMockDepositResponse):
JSON

{
  "transaction": {
    "id": "dep_mock_12345",
    "kind": "deposit",
    "status": "pending_user",
    "assetCode": "XLM",
    "amountIn": "500.0000000",
    "amountOut": "498.5000000",
    "feeAmount": "1.5000000",
    "stellarAccount": "GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR",
    "externalTransactionId": "SEPA-REF-0001",
    "userActionRequired": true,
    "message": "Please confirm the bank transfer details in the anchor portal.",
    "startedAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-01T00:00:00Z",
    "metadata": {
      "rail": "SEPA"
    }
  },
  "userActionUrl": "https://anchor.example.com/portal/deposit?id=dep_mock_12345",
  "instructions": "Initiate a SEPA transfer of 500 EUR using reference code SEPA-REF-0001."
}
1.2 Withdrawal Creation
Initiates a withdrawal flow where a user locks/sends Stellar assets to the anchor on-chain, and the anchor mock-delivers off-chain funds to the user's destination bank/account.

Endpoint: POST /api/anchor/withdraw
Request Payload (AnchorMockWithdrawalRequest / WithdrawalRequestMetadata):
JSON

{
  "assetCode": "USDC",
  "amount": "250.75",
  "account": "GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR",
  "memo": "WITHDRAW-99",
  "memoType": "text",
  "railId": "ach_us_bank",
  "dest": "US123456789012",
  "destExtra": "ACCT-4421",
  "type": "ACH"
}
Response Payload (AnchorMockWithdrawalResponse):
JSON

{
  "transaction": {
    "id": "with_mock_12345",
    "kind": "withdrawal",
    "status": "pending_user",
    "assetCode": "USDC",
    "amountIn": "250.75",
    "amountOut": "248.75",
    "feeAmount": "2.00",
    "stellarAccount": "GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR",
    "externalTransactionId": "ACH-OUT-8812",
    "userActionRequired": true,
    "message": "Confirm the destination bank account in the anchor portal.",
    "startedAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-01T00:00:00Z",
    "metadata": {
      "rail": "ACH"
    }
  },
  "memo": "WITHDRAW-99",
  "memoType": "text",
  "anchorAddress": "GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR"
}
1.3 Status Lookup
Retrieves the detailed status of an existing transaction. Includes visual badge configurations and user-facing notifications based on status.

Endpoint: GET /api/anchor/transactions?id=<tx_id>
Response Payload (AnchorMockStatusResponse):
JSON

{
  "transaction": {
    "id": "dep_mock_12345",
    "kind": "deposit",
    "status": "pending_anchor",
    "assetCode": "XLM",
    "amountIn": "500.0000000",
    "amountOut": "498.5000000",
    "feeAmount": "1.5000000",
    "stellarAccount": "GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR",
    "externalTransactionId": "SEPA-REF-0001",
    "userActionRequired": false,
    "message": "Anchor has received the bank transfer and is preparing the Stellar transaction.",
    "startedAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-01T02:00:00Z",
    "metadata": {
      "rail": "SEPA"
    }
  },
  "status": "pending_anchor",
  "userMessage": {
    "headline": "Deposit being processed by anchor",
    "detail": "The anchor is reviewing and processing your request. This can take a few minutes.",
    "severity": "info"
  }
}
1.4 Lifecycle Updates (Simulation)
Allows simulation of background processes. Forces a state transition or updates message/transaction metadata. Standard state transition validation is checked unless forced.

Endpoint: PATCH /api/anchor/transactions/<tx_id>
Request Payload (AnchorMockUpdateRequest):
JSON

{
  "status": "pending_stellar",
  "message": "Stellar transaction submitted. Awaiting ledger confirmation.",
  "stellarTransactionId": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2"
}
Response Payload (AnchorMockUpdateResponse):
JSON

{
  "ok": true,
  "transaction": {
    "id": "dep_mock_12345",
    "kind": "deposit",
    "status": "pending_stellar",
    "assetCode": "XLM",
    "amountIn": "500.0000000",
    "amountOut": "498.5000000",
    "feeAmount": "1.5000000",
    "stellarAccount": "GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR",
    "stellarTransactionId": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
    "externalTransactionId": "SEPA-REF-0001",
    "userActionRequired": false,
    "message": "Stellar transaction submitted. Awaiting ledger confirmation.",
    "startedAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-01T04:00:00Z",
    "metadata": {
      "rail": "SEPA"
    }
  }
}
1.5 Error Responses
Standard error contract for schema validation failures or illegal lifecycle transition attempts.

Status Code: 400 Bad Request or 422 Unprocessable Entity
Response Payload (AnchorMockErrorResponse):
JSON

{
  "ok": false,
  "error": "Illegal status transition from pending_user to completed.",
  "code": "ILLEGAL_LIFECYCLE_TRANSITION",
  "userSafeMessage": "This transaction transition is not allowed by the anchor lifecycle rules.",
  "details": {
    "from": "pending_user",
    "to": "completed",
    "allowed": ["pending_anchor"]
  }
}
2. Status Mapping & Tones
Each anchor transaction status maps cleanly to specific visual indicators (Tailwind-aligned tones) and default notification severity levels.

Status	Display Label	Tailwind Badge Tone	User Message Severity	Description
pending_user	Awaiting You	amber (Warning)	warning	Waiting on user action (KYC flow, 2FA, external bank transfer setup).
pending_anchor	Anchor Processing	blue (Primary)	info	Under internal review/processing by the anchor.
pending_stellar	Settling on Stellar	blue (Primary)	info	On-chain tx submitted, waiting for ledger consensus.
completed	Completed	green (Success)	success	Terminal: Funds successfully credited/delivered on-chain or off-chain.
failed	Failed	red (Danger)	error	Terminal: Operation failed unrecoverably.
refunded	Refunded	amber (Warning)	warning	Terminal: Funds returned back to source due to failure/rejection.
3. Transition Rules & Graph
AnchorKit strictly validates mock status updates. Only transitions along the defined edges are legal:

text

    pending_user ──→ pending_anchor ──→ pending_stellar ──→ completed
                               │                   │
                               ├──→ failed         ├──→ failed
                               └──→ refunded       └──→ refunded
Constraints:
Staying in the same status is always valid (from === to).
Terminal states (completed, failed, refunded) are irreversible (no further transitions allowed).
Codebase transition engine rejects illegal moves using @anchorkit/anchor-utils's transition(from, to) helper.
4. Validation Expectations
All request and response models are protected by robust Zod schemas exported from @anchorkit/validators:

AnchorMockDepositRequestSchema: Identical to DepositRequestMetadataSchema. Requires standard asset codes (≤ 12 chars), positive decimal amounts, and valid Stellar destination public keys.
AnchorMockDepositResponseSchema: Ensures returned object encapsulates the full AnchorTransactionRecord alongside optional userActionUrl and developer instructions.
AnchorMockWithdrawalRequestSchema: Requires standard withdrawal metadata including an explicit non-empty external account destination dest.
AnchorMockWithdrawalResponseSchema: Guarantees the response defines the receiving anchorAddress on-chain, matching memo and memoType.
AnchorMockStatusResponseSchema: Validates status lookup structures and the standard visual copy parameters of userMessage.
AnchorMockUpdateRequestSchema: Re-validates field formats during background updates (e.g. transaction hashes, amount validations).
AnchorMockErrorResponseSchema: Enforces strict format for error output keeping details as arbitrary payload maps.
5. Test Fixtures & Examples
Examples Directory (examples/)
JSON files representing the validated mock API payload snapshots are maintained as executable contract examples:

Deposit request/response contract:
examples/anchors-mock-api-deposit-request.json
examples/anchors-mock-api-deposit-response.json
Withdrawal request/response contract:
examples/anchors-mock-api-withdrawal-request.json
examples/anchors-mock-api-withdrawal-response.json
Transaction polling contract:
examples/anchors-mock-api-status-response.json
Simulations & updates contract:
examples/anchors-mock-api-update-request.json
examples/anchors-mock-api-update-response.json
Error scenarios contract:
examples/anchors-mock-api-error-response.json
Centralized Fixtures Package (@anchorkit/fixtures)
The fixtures package exports deterministic types matching these contracts, useful for mock server setups and UI component storybooks:

sampleDepositRequest (matches DepositRequestMetadata)
sampleWithdrawalRequest (matches WithdrawalRequestMetadata)
buildDepositLifecycle() (returns sequence of 4 mock stages)
buildWithdrawalLifecycle() (returns sequence of 5 mock stages including failed/refunded states)