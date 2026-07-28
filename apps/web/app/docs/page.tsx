"use client";

import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Card } from "@/components/ui";

const docsNav = [
  {
    group: "Getting started",
    items: [
      { title: "Project overview", file: "PROJECT_OVERVIEW.md" },
      { title: "Local setup", file: "LOCAL_SETUP.md" },
      { title: "Architecture", file: "ARCHITECTURE.md" },
      { title: "Capability states", file: "CAPABILITY_STATES.md" },
      { title: "Roadmap & capability disclaimer", file: "ROADMAP.md" },
    ],
  },
  {
    group: "Stellar usage",
    items: [
      { title: "Stellar testnet usage", file: "STELLAR_TESTNET_USAGE.md" },
      { title: "Security notes", file: "SECURITY_NOTES.md" },
      { title: "Secret key handling rules", file: "SECRET_KEY_HANDLING.md" },
      { title: "Account utilities", file: "ACCOUNT_UTILITIES.md" },
      { title: "Payment intent utilities", file: "PAYMENT_INTENT_UTILITIES.md" },
      { title: "Transaction readiness", file: "transaction-readiness.md" },
      { title: "Transaction receipts", file: "transaction-receipts.md" },
    ],
  },
  {
    group: "Anchors & Soroban",
    items: [
      { title: "Anchor utilities", file: "ANCHOR_UTILITIES.md" },
      { title: "Soroban escrow contract", file: "SOROBAN_ESCROW_CONTRACT.md" },
    ],
  },
  {
    group: "Community & GrantFox",
    items: [
      { title: "Contributor guide", file: "CONTRIBUTOR_GUIDE.md" },
      { title: "Maintainer guide", file: "MAINTAINER_GUIDE.md" },
      { title: "Issue writing guide", file: "ISSUE_WRITING_GUIDE.md" },
      { title: "Advanced issue standard", file: "ISSUE_STANDARD.md" },
      { title: "GrantFox contribution workflow", file: "GRANTFOX_WORKFLOW.md" },
      { title: "Maintainer review checklist", file: "MAINTAINER_REVIEW_CHECKLIST.md" },
    ],
  },
];

export default function DocsPage() {
  return (
    <PageShell
      eyebrow="Docs"
      title="AnchorKit documentation"
      subtitle="All documentation lives as markdown under /docs in the repo. This page links to the primary topics and lets contributors locate the file they need to update."
    >
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {docsNav.map((group) => (
          <Card key={group.group}>
            <h3 className="text-mono-xs uppercase tracking-widest text-ink-500 dark:text-ink-400">
              {group.group}
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              {group.items.map((i) => (
                <li key={i.file}>
                  <Link
                    href={`/docs#${i.file}`}
                    className="flex items-center justify-between rounded-md border border-ink-200 px-3 py-2 hover:bg-ink-50 dark:border-ink-800 dark:hover:bg-ink-900"
                  >
                    <span>{i.title}</span>
                    <span className="text-mono-xs text-ink-500 dark:text-ink-400 truncate max-w-[160px]">
                      /docs/{i.file}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="text-base font-semibold tracking-tight">Where to read next</h2>
        <ol className="mt-3 space-y-2 text-sm text-ink-700 dark:text-ink-200">
          <li>
            <span className="font-medium">1. </span>
            Read LOCAL_SETUP.md to install pnpm, Rust, and the Soroban CLI, then run the dev
            dashboard locally.
          </li>
          <li>
            <span className="font-medium">2. </span>
            Skim ARCHITECTURE.md to understand the monorepo layout (apps/web, packages/*,
            contracts/*).
          </li>
          <li>
            <span className="font-medium">3. </span>
            Read SECURITY_NOTES.md and SECRET_KEY_HANDLING.md before wiring any live transaction
            submission or wallet integrations.
          </li>
          <li>
            <span className="font-medium">4. </span>
            If you are contributing via GrantFox, read GRANTFOX_WORKFLOW.md, ISSUE_STANDARD.md, and
            MAINTAINER_REVIEW_CHECKLIST.md before opening your first PR.
          </li>
        </ol>
      </Card>

      <Card>
        <h2 className="text-base font-semibold tracking-tight">Local run commands</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-ink-200 bg-ink-50 p-4 text-mono-sm dark:border-ink-800 dark:bg-ink-900">
            <div className="font-semibold">Install dependencies</div>
            <pre className="mt-1 whitespace-pre-wrap break-all">pnpm install</pre>
          </div>
          <div className="rounded-lg border border-ink-200 bg-ink-50 p-4 text-mono-sm dark:border-ink-800 dark:bg-ink-900">
            <div className="font-semibold">Start web dashboard (testnet)</div>
            <pre className="mt-1 whitespace-pre-wrap break-all">pnpm web:dev</pre>
          </div>
          <div className="rounded-lg border border-ink-200 bg-ink-50 p-4 text-mono-sm dark:border-ink-800 dark:bg-ink-900">
            <div className="font-semibold">Run all TS tests</div>
            <pre className="mt-1 whitespace-pre-wrap break-all">pnpm test</pre>
          </div>
          <div className="rounded-lg border border-ink-200 bg-ink-50 p-4 text-mono-sm dark:border-ink-800 dark:bg-ink-900">
            <div className="font-semibold">Run Soroban contract tests</div>
            <pre className="mt-1 whitespace-pre-wrap break-all">pnpm contract:test</pre>
          </div>
        </div>
      </Card>
    </PageShell>
  );
}
