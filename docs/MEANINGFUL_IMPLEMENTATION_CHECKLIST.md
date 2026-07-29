# Meaningful Implementation Checklist

Use this checklist before opening or approving an AnchorKit PR. It defines meaningful implementation work as a scoped change that solves the issue across the affected repository surfaces, proves the behavior with evidence, and keeps documentation/examples aligned.

This guide complements [MEANINGFUL_WORK_EXAMPLES.md](./MEANINGFUL_WORK_EXAMPLES.md) and [LOW_EFFORT_CONTRIBUTION_EXAMPLES.md](./LOW_EFFORT_CONTRIBUTION_EXAMPLES.md). Those guides show examples; this checklist is the operational review list.

## Definition

A meaningful implementation:

- Addresses the full issue body and acceptance criteria, not only the title.
- Updates every affected package, app, contract, script, example, fixture, or doc surface needed for the change to work.
- Includes tests, CI evidence, screenshots, manual verification, or a precise no-test justification matched to the changed behavior.
- Updates docs/examples when behavior, commands, public APIs, contributor workflow, or capability wording changes.
- Avoids unrelated formatting, broad rewrites, generated churn, placeholder scaffolding, and hidden second-issue work.

## Before Implementing

- [ ] Read the full issue body, acceptance criteria, labels, comments, and linked docs.
- [ ] Identify each affected workspace: `apps/web`, `packages/*`, `contracts/treasury-escrow`, `docs/`, `examples/`, `.github/`, or `scripts/`.
- [ ] Decide which behavior must change and which files or symbols prove that behavior.
- [ ] Identify expected tests or no-test justification before editing.
- [ ] Check for existing PRs or merged work that already covers the issue.

## During Implementation

- [ ] Keep the diff scoped to the issue.
- [ ] Update all required package exports, imports, docs, fixtures, examples, and UI states that depend on the changed behavior.
- [ ] Include happy-path and negative-path handling when the issue touches validation, security, balances, network selection, callbacks, escrow state, or API contracts.
- [ ] Preserve testnet-only, mock-only, dashboard-only, and non-production disclaimers.
- [ ] Avoid leaving unused helpers, placeholder docs, TODO-only changes, or dead code.

## Cross-Package Impact

When a change crosses package boundaries, verify:

| Surface | What to check |
| ------- | ------------- |
| `packages/types` | Branded types, exported interfaces, and shared status unions still match consumers. |
| `packages/config` | Network, endpoint, and feature defaults remain testnet-safe. |
| `packages/fixtures` | Fixtures still match validator schemas and examples. |
| `packages/validators` | Positive and negative validation behavior is tested. |
| `packages/stellar-kit` | Account, transaction, asset, and network assumptions remain explicit. |
| `packages/anchor-utils` | Anchor/SEP metadata handling and error normalization are covered. |
| `apps/web` | UI states, copy, screenshots, and mock/testnet limitations are aligned. |
| `contracts/treasury-escrow` | Authorization, state transitions, timestamps, terminal states, and errors are tested. |

## Tests And Docs

- [ ] Test evidence matches each changed behavior. Use [MINIMUM_TESTING_STANDARD.md](./MINIMUM_TESTING_STANDARD.md) for area-specific expectations.
- [ ] Commands run are listed, or skipped commands are explained.
- [ ] CI status is clear and failing checks are handled with evidence.
- [ ] README, docs, fixtures, screenshots, and examples are updated when behavior or workflow changes.
- [ ] New guides are linked from the README docs index.

## Acceptance Criteria Review

- [ ] Every criterion appears in the PR body, completion table, or traceability table.
- [ ] Each criterion has implementation evidence.
- [ ] Each criterion has test, manual, static, docs-only, or no-test evidence.
- [ ] Partial or blocked criteria are not presented as complete.
- [ ] The final PR summary explains why the implementation is meaningful for the original issue.

## Small Incomplete Examples

These are not meaningful by themselves:

- Adding a README sentence when the issue asks for package behavior and tests.
- Updating a UI label while leaving the fixture, validator, or error branch unchanged.
- Adding a happy-path test while the issue asks for rejected invalid input.
- Touching one package export while downstream examples or docs still show the old API.
- Posting a PR with failing CI and no explanation of whether the failure is branch-caused or unrelated.

## Related Guides

- [Acceptance Criteria Traceability Table](./ACCEPTANCE_CRITERIA_TRACEABILITY.md)
- [Contributor Self-Review Template](./CONTRIBUTOR_SELF_REVIEW_TEMPLATE.md)
- [Test Evidence PR Requirement](./TEST_EVIDENCE_REQUIREMENT.md)
- [Minimum Testing Standard](./MINIMUM_TESTING_STANDARD.md)
- [Failing CI Response Guide](./FAILING_CI_RESPONSE_GUIDE.md)