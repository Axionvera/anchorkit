# Cross-Package Integration Tests

AnchorKit's integration suite verifies that public package APIs continue to
compose correctly. Unit tests remain inside each package; these tests focus on
data crossing package boundaries from deterministic fixtures, through runtime
validation and domain helpers, into consumer-facing models.

## Run the suite

From the repository root:

```bash
pnpm test:integration
```

The integration workspace is also included in the normal `pnpm test` task
graph. Turbo builds its package dependencies before Vitest runs, so tests use
the same public entry points that downstream consumers import.

## Covered flows

| Test                            | Packages composed                                                | Behaviour verified                                                                                                                                                                       |
| ------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `payment-validation.test.ts`    | `fixtures`, `validators`, `stellar-kit`, `config`                | Intent validation/readiness/summary composition, plus default mainnet safety through config → readiness → severity.                                                                      |
| `transaction-readiness.test.ts` | `types`, `stellar-kit`                                           | Ready/invalid/blocked/warning/unavailable readiness pipeline states compose through public APIs.                                                                                         |
| `validation-ui-state.test.ts`   | `types`, `stellar-kit`, `anchor-utils`                           | Validation UI states span loading/invalid/warning/ready/blocked across payment readiness and anchor validation.                                                                          |
| `anchor-lifecycle.test.ts`      | `fixtures`, `validators`, `anchor-utils`, `stellar-kit`, `types` | Deposit/withdrawal mapping plus lifecycle state-machine legality, including the withdrawal fixture illegality contract.                                                                  |
| `escrow-milestone.test.ts`      | `fixtures`, `types`, `validators`, `stellar-kit`                 | Milestone/UI/summary validation, event↔snapshot consistency, and release receipt mapping.                                                                                                |
| `diagnostics-export.test.ts`    | `fixtures`, `stellar-kit`, `validators`, `config`                | Account and config diagnostics export, including reserve/explorer metadata and secret redaction.                                                                                         |

All scenarios are deterministic and make no Horizon, RPC, or mainnet calls.

## Shared-fixture contract

`buildDepositLifecycle()` is a legal transition path and must remain so under
`findFirstIllegalTransition`.

`buildWithdrawalLifecycle()` is an unordered **status snapshot set** used for
mapping/receipt coverage. Its sequence includes
`pending_user → pending_stellar`, which the lifecycle state machine rejects.
Integration tests assert that illegality explicitly rather than treating the
fixture as a happy-path transition list.

## Layout

```text
tests/integration/
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── test/
    ├── fixtures.ts
    ├── payment-validation.test.ts
    ├── transaction-readiness.test.ts
    ├── validation-ui-state.test.ts
    ├── anchor-lifecycle.test.ts
    ├── escrow-milestone.test.ts
    └── diagnostics-export.test.ts
```

`test/fixtures.ts` composes data from `@anchorkit/fixtures`; it must not copy
production constants or introduce real account secrets.

Script-only validators such as `tests/validate-issues.test.ts` remain outside
this workspace because they exercise repository automation, not package public
APIs.

## Adding an integration test

Use an integration test when the behaviour depends on at least two public
AnchorKit packages. Otherwise, add a unit test to the package that owns the
behaviour.

1. Import only from public package entry points such as
   `@anchorkit/validators`, never another package's `src/` directory.
2. Start with deterministic data from `@anchorkit/fixtures`.
3. Validate untrusted fixture/input data before passing it to domain helpers.
4. Assert both the successful composed output and a meaningful negative path.
5. Keep network access injected or disabled.
6. Run `pnpm test:integration`, `pnpm typecheck`, and
   `pnpm check:boundaries`.

If a new package participates in the flow, add it to
`tests/integration/package.json` using `workspace:*` so Turbo can build it
before the suite runs.
