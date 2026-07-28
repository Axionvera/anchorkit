/**
 * Shared example registry (issue #33).
 *
 * Single source of truth mapping every fixture in `examples/` to the schema
 * it should satisfy, plus whether it is expected to be *valid* or *invalid*.
 * The fixture validation script (`scripts/check-examples.mts`) and the
 * `examples.test.ts` vitest suite both consume this registry, so adding a new
 * example is a one-line change here.
 *
 * Schema names map to the exported Zod schemas in `@anchorkit/validators`.
 * `expect: 'invalid'` is used for fixtures that are deliberately crafted to
 * fail validation (e.g. `payments-invalid-intent.json`).
 */

export type ExampleExpectation = "valid" | "invalid";

export interface ExampleEntry {
  /** Unique id used in tests / reports. */
  id: string;
  /** Path relative to repo root. */
  path: string;
  /** Zod schema exported from `@anchorkit/validators`. */
  schema:
    | "PaymentIntent"
    | "StellarAsset"
    | "AnchorTransactionRecord"
    | "Milestone"
    | "StellarPublicKeyArray"
    | "TransactionReceipt"
    | "AnchorMockDepositRequest"
    | "AnchorMockDepositResponse"
    | "AnchorMockWithdrawalRequest"
    | "AnchorMockWithdrawalResponse"
    | "AnchorMockStatusResponse"
    | "AnchorMockUpdateRequest"
    | "AnchorMockUpdateResponse"
    | "AnchorMockErrorResponse";
  /** Whether the example must pass or must fail schema validation. */
  expect: ExampleExpectation;
  /** When the file is a JSON array, validate each element. */
  isArray?: boolean;
  /** When the array lives under a property (e.g. `{ receipts: [...] }`). */
  arrayKey?: string;
}

export const EXAMPLE_REGISTRY: ExampleEntry[] = [
  {
    id: "payments-valid-intent",
    path: "examples/payments-valid-intent.json",
    schema: "PaymentIntent",
    expect: "valid",
  },
  {
    id: "payments-invalid-intent",
    path: "examples/payments-invalid-intent.json",
    schema: "PaymentIntent",
    expect: "invalid",
  },
  {
    id: "assets-native-xlm",
    path: "examples/assets-native-xlm.json",
    schema: "StellarAsset",
    expect: "valid",
  },
  {
    id: "assets-issued-example",
    path: "examples/assets-issued-example.json",
    schema: "StellarAsset",
    expect: "valid",
  },
  {
    id: "accounts-funded",
    path: "examples/accounts-funded.json",
    schema: "StellarPublicKeyArray",
    expect: "valid",
    isArray: true,
  },
  {
    id: "accounts-unfunded",
    path: "examples/accounts-unfunded.json",
    schema: "StellarPublicKeyArray",
    expect: "valid",
    isArray: true,
  },
  {
    id: "anchors-deposit-lifecycle",
    path: "examples/anchors-deposit-lifecycle.json",
    schema: "AnchorTransactionRecord",
    expect: "valid",
    isArray: true,
  },
  {
    id: "anchors-withdrawal-lifecycle",
    path: "examples/anchors-withdrawal-lifecycle.json",
    schema: "AnchorTransactionRecord",
    expect: "valid",
    isArray: true,
  },
  {
    id: "escrow-milestone-lifecycle",
    path: "examples/escrow-milestone-lifecycle.json",
    schema: "Milestone",
    expect: "valid",
    isArray: true,
  },
  {
    id: "transaction-receipts",
    path: "examples/transaction-receipts.example.json",
    schema: "TransactionReceipt",
    expect: "valid",
    isArray: true,
    arrayKey: "receipts",
  },
  {
    id: "anchors-mock-api-deposit-request",
    path: "examples/anchors-mock-api-deposit-request.json",
    schema: "AnchorMockDepositRequest",
    expect: "valid",
  },
  {
    id: "anchors-mock-api-deposit-response",
    path: "examples/anchors-mock-api-deposit-response.json",
    schema: "AnchorMockDepositResponse",
    expect: "valid",
  },
  {
    id: "anchors-mock-api-withdrawal-request",
    path: "examples/anchors-mock-api-withdrawal-request.json",
    schema: "AnchorMockWithdrawalRequest",
    expect: "valid",
  },
  {
    id: "anchors-mock-api-withdrawal-response",
    path: "examples/anchors-mock-api-withdrawal-response.json",
    schema: "AnchorMockWithdrawalResponse",
    expect: "valid",
  },
  {
    id: "anchors-mock-api-status-response",
    path: "examples/anchors-mock-api-status-response.json",
    schema: "AnchorMockStatusResponse",
    expect: "valid",
  },
  {
    id: "anchors-mock-api-update-request",
    path: "examples/anchors-mock-api-update-request.json",
    schema: "AnchorMockUpdateRequest",
    expect: "valid",
  },
  {
    id: "anchors-mock-api-update-response",
    path: "examples/anchors-mock-api-update-response.json",
    schema: "AnchorMockUpdateResponse",
    expect: "valid",
  },
  {
    id: "anchors-mock-api-error-response",
    path: "examples/anchors-mock-api-error-response.json",
    schema: "AnchorMockErrorResponse",
    expect: "valid",
  },
];
