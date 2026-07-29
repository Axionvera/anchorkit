"use client";

import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Card, Button } from "@/components/ui";

const modules = [
  {
    href: "/accounts",
    title: "Account Utilities",
    tag: "stellar-kit",
    blurb:
      "Generate testnet keypairs, validate public keys, and check funded/unfunded status via Horizon.",
    bullets: ["Keypair generator", "Horizon lookup", "Stellar Expert links"],
    tone: "from-stellar-500 to-stellar-700",
  },
  {
    href: "/payments",
    title: "Payment Intent Builder",
    tag: "stellar-kit",
    blurb:
      "Validate source/destination keys, amount, memo, and check transaction readiness before submission.",
    bullets: ["Intent validation", "Readiness warnings", "Memo checks"],
    tone: "from-emerald-500 to-teal-700",
  },
  {
    href: "/anchors",
    title: "Anchor Flows & Statuses",
    tag: "anchor-utils",
    blurb:
      "Mock SEP-style deposit/withdrawal lifecycles using typed anchor transaction statuses and badges.",
    bullets: ["Mock fixtures", "Status mapping", "Callback URL validation"],
    tone: "from-anchor-500 to-anchor-700",
  },
  {
    href: "/escrow",
    title: "Soroban Treasury Escrow",
    tag: "treasury-escrow",
    blurb:
      "Walk the milestone lifecycle implemented in the Rust Soroban contract: evidence, approval, dispute, release.",
    bullets: ["Milestone states", "Events", "Admin-only guards"],
    tone: "from-soroban-500 to-purple-700",
  },
];

export default function HomePage() {
  return (
    <PageShell
      eyebrow="AnchorKit MVP"
      title="Build, test, and debug Stellar integrations with a testnet-first toolkit."
      subtitle="AnchorKit ships reusable TypeScript utilities, SEP-style anchor helpers, a Soroban treasury escrow example, and a local developer dashboard — all ready for GrantFox OSS contributors."
      warning="This dashboard targets the Stellar Testnet only. Do not use mainnet secrets, and never custody real user funds in the MVP."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {modules.map((m) => (
          <Card key={m.href} className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div
                className={`inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${m.tone} text-white shadow-sm`}
              >
                <span className="text-mono-sm font-bold">{m.tag.charAt(0).toUpperCase()}</span>
              </div>
              <span className="rounded-full border border-ink-200 bg-ink-50 px-2.5 py-0.5 text-mono-xs text-ink-600 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-300">
                @{m.tag}
              </span>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-semibold tracking-tight">{m.title}</h3>
              <p className="text-sm text-ink-500 dark:text-ink-300">{m.blurb}</p>
            </div>
            <ul className="space-y-1">
              {m.bullets.map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-2 text-sm text-ink-700 dark:text-ink-200"
                >
                  <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-stellar-500" />
                  {b}
                </li>
              ))}
            </ul>
            <div className="mt-2 flex items-center justify-end">
              <Link href={m.href}>
                <Button variant="secondary">Open page →</Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <h3 className="text-mono-xs uppercase tracking-widest text-ink-500 dark:text-ink-400">
            Testnet-first
          </h3>
          <p className="mt-2 text-sm text-ink-700 dark:text-ink-200">
            Horizon URLs, network passphrase, and Stellar Expert links all default to Testnet.
            Mainnet is config-only and explicitly gated.
          </p>
        </Card>
        <Card>
          <h3 className="text-mono-xs uppercase tracking-widest text-ink-500 dark:text-ink-400">
            Secret-safe
          </h3>
          <p className="mt-2 text-sm text-ink-700 dark:text-ink-200">
            Secret keys are redacted in logs, errors, and UI. Generated keypairs show the secret
            once only and are clearly marked local-only demo.
          </p>
        </Card>
        <Card>
          <h3 className="text-mono-xs uppercase tracking-widest text-ink-500 dark:text-ink-400">
            GrantFox-ready
          </h3>
          <p className="mt-2 text-sm text-ink-700 dark:text-ink-200">
            Issue templates, pull request template, review checklist, labels, and contributor guides
            are pre-shipped for open-source grants.
          </p>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-semibold tracking-tight">Quick links</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/docs" className="group">
            <div className="rounded-lg border border-ink-200 p-4 transition-colors group-hover:border-stellar-400 dark:border-ink-800 group-hover:dark:border-stellar-700">
              <div className="text-sm font-medium">Project documentation</div>
              <div className="mt-1 text-mono-xs text-ink-500 dark:text-ink-400">/docs</div>
            </div>
          </Link>
          <Link href="/dashboard" className="group">
            <div className="rounded-lg border border-ink-200 p-4 transition-colors group-hover:border-stellar-400 dark:border-ink-800 group-hover:dark:border-stellar-700">
              <div className="text-sm font-medium">Developer dashboard</div>
              <div className="mt-1 text-mono-xs text-ink-500 dark:text-ink-400">/dashboard</div>
            </div>
          </Link>
          <a
            href="https://stellar.expert/explorer/testnet"
            target="_blank"
            rel="noreferrer"
            className="group"
          >
            <div className="rounded-lg border border-ink-200 p-4 transition-colors group-hover:border-stellar-400 dark:border-ink-800 group-hover:dark:border-stellar-700">
              <div className="text-sm font-medium">Stellar Expert (Testnet) ↗</div>
              <div className="mt-1 text-mono-xs text-ink-500 dark:text-ink-400">stellar.expert</div>
            </div>
          </a>
          <a
            href="https://developers.stellar.org/docs"
            target="_blank"
            rel="noreferrer"
            className="group"
          >
            <div className="rounded-lg border border-ink-200 p-4 transition-colors group-hover:border-stellar-400 dark:border-ink-800 group-hover:dark:border-stellar-700">
              <div className="text-sm font-medium">Stellar developer docs ↗</div>
              <div className="mt-1 text-mono-xs text-ink-500 dark:text-ink-400">
                developers.stellar.org
              </div>
            </div>
          </a>
        </div>
      </Card>
    </PageShell>
  );
}
