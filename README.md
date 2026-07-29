AnchorKit
Open-source Stellar developer toolkit for builders working with Stellar wallets, anchors, payment rails, SEP flows, and Soroban-based treasury logic.

AnchorKit is a seriously-built pnpm + Turborepo monorepo for the Stellar
ecosystem. It ships reusable TypeScript utilities, a testnet-first developer
dashboard, a Rust Soroban treasury escrow example contract, comprehensive
documentation, and a GrantFox-ready contribution structure.

text

org: stellar-commons-labs
repo: anchorkit
mvp: 0.1.x (testnet-only by default)
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

## 📚 Docs index

All of these live under [`./docs/`](./docs/).

| Topic                                             | File                                                                            |
| ------------------------------------------------- | ------------------------------------------------------------------------------- |
| Project overview                                  | [`PROJECT_OVERVIEW.md`](./docs/PROJECT_OVERVIEW.md)                             |
| End-to-end developer journey                      | [`DEVELOPER_JOURNEY.md`](./docs/DEVELOPER_JOURNEY.md)                           |
| Local setup                                       | [`LOCAL_SETUP.md`](./docs/LOCAL_SETUP.md)                                       |
| Failing CI response guide                         | [`FAILING_CI_RESPONSE_GUIDE.md`](./docs/FAILING_CI_RESPONSE_GUIDE.md)           |
| Test evidence PR requirement                      | [`TEST_EVIDENCE_REQUIREMENT.md`](./docs/TEST_EVIDENCE_REQUIREMENT.md)           |
| Test-first contribution guide                     | [`TEST_FIRST_CONTRIBUTION_GUIDE.md`](./docs/TEST_FIRST_CONTRIBUTION_GUIDE.md)         |
| Minimum testing standard                         | [`MINIMUM_TESTING_STANDARD.md`](./docs/MINIMUM_TESTING_STANDARD.md)             |
| Contributor self-review template                  | [`CONTRIBUTOR_SELF_REVIEW_TEMPLATE.md`](./docs/CONTRIBUTOR_SELF_REVIEW_TEMPLATE.md) |
| Contributor self-assessment form                 | [`CONTRIBUTOR_SELF_ASSESSMENT_FORM.md`](./docs/CONTRIBUTOR_SELF_ASSESSMENT_FORM.md) |
| Architecture / package boundaries                 | [`ARCHITECTURE.md`](./docs/ARCHITECTURE.md)                                     |
| Stellar testnet usage                             | [`STELLAR_TESTNET_USAGE.md`](./docs/STELLAR_TESTNET_USAGE.md)                   |
| Security notes                                    | [`SECURITY_NOTES.md`](./docs/SECURITY_NOTES.md)                                 |
| Security threat model                             | [`SECURITY_THREAT_MODEL.md`](./docs/SECURITY_THREAT_MODEL.md)                   |
| Security & architecture readiness review          | [`SECURITY_ARCHITECTURE_REVIEW.md`](./docs/SECURITY_ARCHITECTURE_REVIEW.md)     |
| Secret key handling rules R0–R6                   | [`SECRET_KEY_HANDLING.md`](./docs/SECRET_KEY_HANDLING.md)                       |
| Account utilities                                 | [`ACCOUNT_UTILITIES.md`](./docs/ACCOUNT_UTILITIES.md)                           |
| Payment intent utilities                          | [`PAYMENT_INTENT_UTILITIES.md`](./docs/PAYMENT_INTENT_UTILITIES.md)             |
| Anchor utilities                                  | [`ANCHOR_UTILITIES.md`](./docs/ANCHOR_UTILITIES.md)                             |
| Soroban treasury escrow contract                  | [`SOROBAN_ESCROW_CONTRACT.md`](./docs/SOROBAN_ESCROW_CONTRACT.md)               |
| Shared error taxonomy                             | [`ERROR_TAXONOMY.md`](./docs/ERROR_TAXONOMY.md)                                 |
| Escrow storage migration guide                    | [`ESCROW_MIGRATION.md`](./docs/ESCROW_MIGRATION.md)                             |
| Escrow compatibility matrix                       | [`ESCROW_COMPATIBILITY_MATRIX.md`](./docs/ESCROW_COMPATIBILITY_MATRIX.md)       |
| Shared test fixtures                              | [`FIXTURE_FRAMEWORK.md`](./docs/FIXTURE_FRAMEWORK.md)                           |
| Status severity mapping                           | [`STATUS_SEVERITY_MAPPING.md`](./docs/STATUS_SEVERITY_MAPPING.md)               |
| Contributor guide                                 | [`CONTRIBUTOR_GUIDE.md`](./docs/CONTRIBUTOR_GUIDE.md)                           |
| Meaningful vs. insufficient contribution examples | [`MEANINGFUL_WORK_EXAMPLES.md`](./docs/MEANINGFUL_WORK_EXAMPLES.md)             |
| Meaningful implementation checklist               | [`MEANINGFUL_IMPLEMENTATION_CHECKLIST.md`](./docs/MEANINGFUL_IMPLEMENTATION_CHECKLIST.md) |
| Low-effort contribution examples              | [`LOW_EFFORT_CONTRIBUTION_EXAMPLES.md`](./docs/LOW_EFFORT_CONTRIBUTION_EXAMPLES.md) |
| Maintainer guide                                  | [`MAINTAINER_GUIDE.md`](./docs/MAINTAINER_GUIDE.md)                             |
| Issue writing guide                               | [`ISSUE_WRITING_GUIDE.md`](./docs/ISSUE_WRITING_GUIDE.md)                       |
| Acceptance criteria completion table              | [`ACCEPTANCE_CRITERIA_COMPLETION.md`](./docs/ACCEPTANCE_CRITERIA_COMPLETION.md) |
| Acceptance criteria audit template              | [`ACCEPTANCE_CRITERIA_AUDIT_TEMPLATE.md`](./docs/ACCEPTANCE_CRITERIA_AUDIT_TEMPLATE.md) |
| Acceptance criteria traceability table            | [`ACCEPTANCE_CRITERIA_TRACEABILITY.md`](./docs/ACCEPTANCE_CRITERIA_TRACEABILITY.md) |
| Issue approval readiness checklist             | [`ISSUE_APPROVAL_READINESS.md`](./docs/ISSUE_APPROVAL_READINESS.md)             |
| GrantFox contribution workflow                    | [`GRANTFOX_WORKFLOW.md`](./docs/GRANTFOX_WORKFLOW.md)                           |
| Contributor payment expectations                  | [`CONTRIBUTOR_PAYMENT_EXPECTATIONS.md`](./docs/CONTRIBUTOR_PAYMENT_EXPECTATIONS.md) |
| Payment-period conduct note                       | [`PAYMENT_PERIOD_CONDUCT.md`](./docs/PAYMENT_PERIOD_CONDUCT.md)                 |
| Advanced issue standard                           | [`ISSUE_STANDARD.md`](./docs/ISSUE_STANDARD.md)                                 |
| Maintainer review checklist                       | [`MAINTAINER_REVIEW_CHECKLIST.md`](./docs/MAINTAINER_REVIEW_CHECKLIST.md)       |
| Reviewer quality checklist                        | [`REVIEWER_QUALITY_CHECKLIST.md`](./docs/REVIEWER_QUALITY_CHECKLIST.md)         |
| GrantFox reviewer checklist                       | [`GRANTFOX_REVIEWER_CHECKLIST.md`](./docs/GRANTFOX_REVIEWER_CHECKLIST.md)       |
| Evaluation-readiness index                        | [`EVALUATION_READINESS.md`](./docs/EVALUATION_READINESS.md)                     |
| Automation runbook                                | [`AUTOMATION_RUNBOOK.md`](./docs/AUTOMATION_RUNBOOK.md)                         |
| Auto-assign workflow                              | [`AUTO_ASSIGN_WORKFLOW.md`](./docs/AUTO_ASSIGN_WORKFLOW.md)                     |
| Dashboard capability states                       | [`CAPABILITY_STATES.md`](./docs/CAPABILITY_STATES.md)                           |
| Public roadmap & capability disclaimer            | [`ROADMAP.md`](./docs/ROADMAP.md)                                               |

## 🦊 GrantFox readiness

AnchorKit was designed from the start to be a high-quality target for GrantFox
OSS campaigns. The following contribute towards reward-readiness on issues
carrying the `GrantFox OSS` + `Maybe Rewarded` + `Official Campaign | FWC26` labels:

- Detailed, scoped issue templates (`.github/ISSUE_TEMPLATE/grantfox_issue.md` +
  [docs/ISSUE_STANDARD.md](./docs/ISSUE_STANDARD.md)).
- A written contributor flow: [docs/GRANTFOX_WORKFLOW.md](./docs/GRANTFOX_WORKFLOW.md).
- Pre-merge review guidance and quality checklists every PR must pass:
  [docs/MAINTAINER_REVIEW_CHECKLIST.md](./docs/MAINTAINER_REVIEW_CHECKLIST.md) and
  [docs/REVIEWER_QUALITY_CHECKLIST.md](./docs/REVIEWER_QUALITY_CHECKLIST.md).
- A labels manifest covering Stellar ecosystem taxonomy plus the campaign
  labels: see [`.github/LABELS.yml`](./.github/LABELS.yml).

## 💬 Community

- Stellar developers: visit [developers.stellar.org](https://developers.stellar.org) and the
  Stellar Discord for general questions.
- AnchorKit-specific questions: file an issue using the templates in
  `.github/ISSUE_TEMPLATE/`.
- Code of conduct: [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md).
- Private security disclosures: [`SECURITY.md`](./SECURITY.md).

## ⚖️ Licence

AnchorKit source code is released under the Apache 2.0 licence. See
[`LICENCE`](./LICENCE) for the full text.
