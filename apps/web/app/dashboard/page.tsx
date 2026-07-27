"use client";

import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Card, Button } from "@/components/ui";

const sections = [
  {
    href: "/accounts",
    title: "Accounts",
    count: "3 tools",
    desc: "Create testnet keypairs, validate keys, and load Horizon account data.",
    accent: "bg-stellar-500",
  },
  {
    href: "/payments",
    title: "Payments",
    count: "2 modes",
    desc: "Build a payment intent, validate inputs, and check readiness.",
    accent: "bg-anchor-500",
  },
  {
    href: "/anchors",
    title: "Anchors",
    count: "6 statuses",
    desc: "Mock deposit and withdrawal lifecycle with SEP-style status badges.",
    accent: "bg-amber-500",
  },
  {
    href: "/escrow",
    title: "Escrow",
    count: "7 states",
    desc: "Explore the Soroban treasury-escrow contract milestone workflow.",
    accent: "bg-soroban-500",
  },
];

export default function DashboardPage() {
  return (
    <PageShell
      eyebrow="Dashboard"
      title="Developer dashboard"
      subtitle="Jump into the module you are building or testing. Everything is local-first and testnet-only by default."
      warning="Do not paste mainnet secrets into this dashboard. Mainnet is intentionally disabled unless the environment configuration is explicitly overridden."
    >
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {sections.map((s) => (
          <Card key={s.href} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className={`inline-block h-8 w-8 rounded-md ${s.accent} opacity-90`} />
              <span className="text-mono-xs text-ink-500 dark:text-ink-400">{s.count}</span>
            </div>
            <h3 className="text-base font-semibold tracking-tight">{s.title}</h3>
            <p className="flex-1 text-sm text-ink-500 dark:text-ink-300">{s.desc}</p>
            <Link href={s.href}>
              <Button variant="primary" className="w-full">
                Open {s.title}
              </Button>
            </Link>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="text-base font-semibold tracking-tight">Testnet-first warnings</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-700 dark:text-ink-200">
            <li>
              <span className="font-medium text-amber-700 dark:text-amber-300">1.</span> Use
              Friendbot to fund new testnet accounts from the Accounts page.
            </li>
            <li>
              <span className="font-medium text-amber-700 dark:text-amber-300">2.</span> Issued
              asset payments require trustlines on the destination account.
            </li>
            <li>
              <span className="font-medium text-amber-700 dark:text-amber-300">3.</span> Payment
              submission is intentionally behind a demo-mode toggle in MVP; no real TXs are sent
              unless you explicitly wire one.
            </li>
            <li>
              <span className="font-medium text-amber-700 dark:text-amber-300">4.</span> Secret
              keys generated here are ephemeral by default — copy them to a secure place if you
              want to reuse a test identity.
            </li>
          </ul>
        </Card>

        <Card>
          <h2 className="text-base font-semibold tracking-tight">Docs & examples</h2>
          <div className="mt-3 space-y-2 text-sm">
            <Link
              href="/docs"
              className="flex items-center justify-between rounded-md border border-ink-200 px-3 py-2 hover:bg-ink-50 dark:border-ink-800 dark:hover:bg-ink-900"
            >
              <span>Project docs index</span>
              <span className="text-mono-xs text-ink-500">→</span>
            </Link>
            <a
              href="https://github.com/stellar-commons-labs/anchorkit/tree/main/examples"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-md border border-ink-200 px-3 py-2 hover:bg-ink-50 dark:border-ink-800 dark:hover:bg-ink-900"
            >
              <span>Example fixtures ↗</span>
              <span className="text-mono-xs text-ink-500">→</span>
            </a>
            <Link
              href="/docs"
              className="flex items-center justify-between rounded-md border border-ink-200 px-3 py-2 hover:bg-ink-50 dark:border-ink-800 dark:hover:bg-ink-900"
            >
              <span>Contributor guide</span>
              <span className="text-mono-xs text-ink-500">→</span>
            </Link>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
