# Security Policy

AnchorKit takes security seriously, especially because the project deals with
cryptographic keypairs, Stellar transaction building, and example smart
contracts that could hold real value if deployed without care.

> **Important**: If you think you have found a security vulnerability,
> **do NOT open a public GitHub issue.** Follow the private disclosure process
> below.

## Supported versions

For security patching we support:

- The latest release tag (e.g. `v0.1.x`) on the `main` branch.
- The current `HEAD` of the `main` branch.

Older tagged releases are not supported unless they are part of an active long
term support program, which AnchorKit does not currently have.

## Reporting a vulnerability

Send an encrypted or plaintext email to:

```
security@stellar-commons-labs.dev
```

If possible, include:

1. A short description of the vulnerability.
2. A minimal reproduction (fixtures, test case, screenshots).
3. The affected package(s) / contract / commit SHA.
4. Your assessment of severity (low / medium / high / critical) and why.
5. Any proposed fix or patch you have drafted.

You should expect an acknowledgement within **3 working days**.

## Disclosure timeline

1. **Day 0–3**: Reporter emails security@; maintainers acknowledge and start
   triage in a private draft repository.
2. **Day 3–14**: Maintainers reproduce the bug, determine scope, and draft a
   fix. Fixes to the Soroban contract may take longer to review with an
   independent Rust/Soroban auditor.
3. **Day 14 or when fix is ready (whichever comes later)**: Maintainers open a
   GitHub Security Advisory, credit the reporter, attach the patch, and
   publish a release. After that the issue can be discussed publicly.

If the vulnerability is actively being exploited in the wild we may publish a
mitigation notice first.

## Scope

Things in scope for a security report:

- Secret keys being logged, echoed in UI, or stored.
- Mainnet gating bypass or unsafe mainnet-by-default behaviour.
- Bugs in the Soroban treasury-escrow contract that allow:
  - non-admin callers to release funds,
  - duplicate release of the same milestone,
  - bypass of the approval → ready_for_release → release sequence,
  - storage invariants being broken (underflow/overflow in summary aggregations
    that could cause material UI or reporting bugs).
- SSRF, XSS, or injection vulnerabilities in `apps/web` if they can be
  exploited to exfiltrate data from a user’s session.

Things generally out of scope for a security report (file as regular issues instead):

- Bugs in validation that are clearly not exploitable and surface as a typed
  error anyway.
- Styling / UX bugs.
- “Someone could paste a mainnet secret into the dashboard.” This is a warning
  we already surface prominently; unless we actually persist or exfiltrate
  secrets, it is not a vulnerability.

## Bug bounty / rewards

AnchorKit does not operate a paid bug bounty today. For issues that align with
an active GrantFox campaign we may route your report into the campaign at the
maintainers’ discretion.

## Credits

Security advisories are credited in the GitHub Advisory and in a SECURITY_CREDITS.md
file once disclosed.
