# Reviewer Evidence Checklist

A quick-reference checklist for AnchorKit maintainers to verify that a pull request contains sufficient evidence before merging. Each item points to existing detailed guidance — use this as a summary, not a replacement.

---

## Implementation Scope

- [ ] PR references the issue with `Closes #NNN` and the diff matches the issue body, not just the title.
- [ ] Only the intended files are changed — no unrelated formatting, generated churn, or second-issue work.
- [ ] Cross-package impact is addressed across all affected surfaces (`packages/`, `apps/web`, `contracts/`, `docs/`, `examples/`).

See [GRANTFOX_REVIEWER_CHECKLIST.md](./GRANTFOX_REVIEWER_CHECKLIST.md) (Scope Check, Meaningful Implementation Check) and [MEANINGFUL_IMPLEMENTATION_CHECKLIST.md](./MEANINGFUL_IMPLEMENTATION_CHECKLIST.md).

## Implementation Quality

- [ ] Code follows existing patterns — naming, validation (`validate` → `is` → `assert`), package boundaries (`pnpm check:boundaries`).
- [ ] Type system and branded types are enforced at public boundaries.
- [ ] Secret key handling rules R0–R6 are correctly applied to all changed code.

See [REVIEWER_QUALITY_CHECKLIST.md](./REVIEWER_QUALITY_CHECKLIST.md) §2, [MAINTAINER_REVIEW_CHECKLIST.md](./MAINTAINER_REVIEW_CHECKLIST.md) (Secret leakage, Code quality), and [SECRET_KEY_HANDLING.md](./SECRET_KEY_HANDLING.md).

## Test Evidence

- [ ] The PR includes tests, verification evidence, or a specific no-test justification.
- [ ] Positive and negative paths are covered, matching the area-specific minimums.
- [ ] Exact commands run (`pnpm verify`, `pnpm contract:test`, etc.) are listed in the PR description.

See [TEST_EVIDENCE_REQUIREMENT.md](./TEST_EVIDENCE_REQUIREMENT.md) (required evidence format) and [MINIMUM_TESTING_STANDARD.md](./MINIMUM_TESTING_STANDARD.md) (area-specific minimums).

## CI Status

- [ ] CI status is clearly stated — `Passing`, `Failing fixed`, `Failing unrelated`, `Pending`, or `Skipped` — with supporting evidence.
- [ ] Failing checks include evidence of the cause and either a fix commit or an explanation of why the failure is unrelated.

See [FAILING_CI_RESPONSE_GUIDE.md](./FAILING_CI_RESPONSE_GUIDE.md) (handling failures) and [TEST_EVIDENCE_REQUIREMENT.md](./TEST_EVIDENCE_REQUIREMENT.md) (CI status language).

## Documentation Impact

- [ ] Docs under `docs/` are updated when user-facing behavior, commands, or public APIs change.
- [ ] The README docs index is updated if a new doc was added.
- [ ] Security docs are updated if new threat areas are introduced.

See [MAINTAINER_REVIEW_CHECKLIST.md](./MAINTAINER_REVIEW_CHECKLIST.md) (Documentation updates).

## Acceptance Criteria

- [ ] Every issue acceptance criterion maps to implementation and test evidence in the PR body or a completion table.
- [ ] Partial or deferred criteria are explicitly noted with follow-up issue links.

See [ACCEPTANCE_CRITERIA_COMPLETION.md](./ACCEPTANCE_CRITERIA_COMPLETION.md) and [ACCEPTANCE_CRITERIA_TRACEABILITY.md](./ACCEPTANCE_CRITERIA_TRACEABILITY.md).

## Implementation Risk

- [ ] Security impact is assessed — secret leakage, mainnet safety, callback URLs, and authorization changes are reviewed.
- [ ] Residual risk or known limitations are stated in the PR description.
- [ ] No out-of-scope changes slipped in that could introduce regressions.

See [MAINTAINER_REVIEW_CHECKLIST.md](./MAINTAINER_REVIEW_CHECKLIST.md) (Secret leakage, Mainnet safety, Residual risk).

## Related Guides

- [Maintainer Review Checklist](./MAINTAINER_REVIEW_CHECKLIST.md) — full two-phase review
- [Reviewer Quality Checklist](./REVIEWER_QUALITY_CHECKLIST.md) — engineering quality audit
- [GrantFox Reviewer Checklist](./GRANTFOX_REVIEWER_CHECKLIST.md) — campaign-specific review
- [Test Evidence PR Requirement](./TEST_EVIDENCE_REQUIREMENT.md) — required evidence format
- [Minimum Testing Standard](./MINIMUM_TESTING_STANDARD.md) — area-specific expectations
- [Acceptance Criteria Completion Table](./ACCEPTANCE_CRITERIA_COMPLETION.md) — criteria traceability
- [Failing CI Response Guide](./FAILING_CI_RESPONSE_GUIDE.md) — handling CI failures
