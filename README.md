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

Auto-assign workflow	AUTO_ASSIGN_WORKFLOW.md
Roadmap	ROADMAP.md
Escrow compatibility matrix	ESCROW_COMPATIBILITY_MATRIX.md
🦊 GrantFox readiness
upstream/main

Topic File
Project overview PROJECT_OVERVIEW.md
End-to-end developer journey DEVELOPER_JOURNEY.md
Local setup LOCAL_SETUP.md
Architecture / package boundaries ARCHITECTURE.md
Stellar testnet usage STELLAR_TESTNET_USAGE.md
Security notes SECURITY_NOTES.md
Security threat model SECURITY_THREAT_MODEL.md
Security & architecture readiness review SECURITY_ARCHITECTURE_REVIEW.md
Secret key handling rules R0–R6 SECRET_KEY_HANDLING.md
Account utilities ACCOUNT_UTILITIES.md
Payment intent utilities PAYMENT_INTENT_UTILITIES.md
Anchor utilities ANCHOR_UTILITIES.md
Soroban treasury escrow contract SOROBAN_ESCROW_CONTRACT.md
Shared error taxonomy ERROR_TAXONOMY.md
Escrow storage migration guide ESCROW_MIGRATION.md
Shared test fixtures FIXTURE_FRAMEWORK.md
Status severity mapping STATUS_SEVERITY_MAPPING.md
Contributor guide CONTRIBUTOR_GUIDE.md
Maintainer guide MAINTAINER_GUIDE.md
Issue writing guide ISSUE_WRITING_GUIDE.md
GrantFox contribution workflow GRANTFOX_WORKFLOW.md
Advanced issue standard ISSUE_STANDARD.md
Maintainer review checklist MAINTAINER_REVIEW_CHECKLIST.md
Automation runbook	AUTOMATION_RUNBOOK.md
Auto-assign workflow	AUTO_ASSIGN_WORKFLOW.md
Dashboard capability states	CAPABILITY_STATES.md
Public roadmap & capability disclaimer ROADMAP.md
🦊 GrantFox readiness
AnchorKit was designed from the start to be a high-quality target for GrantFox
OSS campaigns. The following contribute towards reward-readiness on issues
carrying the GrantFox OSS + Maybe Rewarded + Official Campaign | FWC26 labels:

Detailed, scoped issue templates (.github/ISSUE_TEMPLATE/grantfox_issue.md +
docs/ISSUE_STANDARD.md).
A written contributor flow: docs/GRANTFOX_WORKFLOW.md.
A pre-merge review checklist every PR must pass:
docs/MAINTAINER_REVIEW_CHECKLIST.md.
A labels manifest covering Stellar ecosystem taxonomy plus the campaign
labels: see .github/LABELS.yml.
💬 Community
Stellar developers: visit developers.stellar.org and the
Stellar Discord for general questions.
AnchorKit-specific questions: file an issue using the templates in
.github/ISSUE_TEMPLATE/.
Code of conduct: CODE_OF_CONDUCT.md.
Private security disclosures: SECURITY.md.
⚖️ Licence
AnchorKit source code is released under the Apache 2.0 licence. See
LICENCE for the full text.