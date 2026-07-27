# Issue Writing Guide

A well-scoped issue saves maintainers and contributors hours. Follow this guidance before you
click “New Issue”. See also [ISSUE_STANDARD.md](./ISSUE_STANDARD.md) for the advanced standard
used for GrantFox-eligible issues.

## 1. One issue per idea

Don’t bundle “refactor X, fix Y, and document Z” into one ticket. Split them. A tightly scoped
ticket is easier to assign, easier to review, and easier to reward on GrantFox.

## 2. State the problem before the solution

Bad: _“Add a new function `foo()` to payments.ts”_

Good:
> **Problem**: Callers of `estimateTransactionReadiness` cannot distinguish “source account
> unreachable” from “source definitely unfunded” from the warnings list today. They need
> separate codes so UIs can render Friendbot CTAs only for the unfunded case.

## 3. Provide context + reproduction

- Paste the exact input, output, and error if reporting a bug.
- Link to the Stellar documentation / SEP / relevant RFC if the issue is protocol related.
- Provide example fixtures under `examples/` for complex flows.

## 4. Define acceptance criteria (ACs)

Write a short bulleted list of **what must be true** to close the ticket. For example:

- [ ] New warning code `SOURCE_NETWORK_ERROR` added to ReadinessWarning union.
- [ ] `estimateTransactionReadiness` returns `SOURCE_NETWORK_ERROR` when the Horizon call
      rejects with a network failure, separately from `SOURCE_UNFUNDED`.
- [ ] Vitest tests cover both branches.
- [ ] Dashboard payments page labels the network-error case appropriately.

## 5. Estimate the scope

Mark roughly:
- `small` — ≤ 1 file change, < 40 lines, usually 1-2 hours.
- `medium` — 2-5 files, focused feature, usually a day or two.
- `large` — cross-cutting, needs design, multi-day. Smaller sub-issues are probably needed.

## 6. For GrantFox issues

Upgrade the issue to follow [ISSUE_STANDARD.md](./ISSUE_STANDARD.md) end-to-end. Only those
tickets should carry the `GrantFox OSS` + `Maybe Rewarded` campaign labels.
