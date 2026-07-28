"use client";

import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Card, Button, CapabilityBadge } from "@/components/ui";
import { MODULE_CAPABILITIES } from "@anchorkit/config";
import type { CapabilityModuleId } from "@anchorkit/types";

type ModuleMeta = { href: string; count: string; accent: string };

const MODULE_META: Record<CapabilityModuleId, ModuleMeta> = {
  accounts: { href: "/accounts", count: "3 tools", accent: "bg-stellar-500" },
  payments: { href: "/payments", count: "2 modes", accent: "bg-anchor-500" },
  anchors: { href: "/anchors", count: "6 statuses", accent: "bg-amber-500" },
  escrow: { href: "/escrow", count: "7 states", accent: "bg-soroban-500" },
  diagnostics: { href: "/diagnostics", count: "0 tools", accent: "bg-ink-500" },
  "network-config": { href: "/network-config", count: "3 networks", accent: "bg-purple-500" },
};

export default function DashboardPage() {
  return (
    <PageShell
      eyebrow="Dashboard"
      title="Developer dashboard"
      subtitle="Jump into the module you are building or testing. Everything is local-first and testnet-only by default."
      warning="Do not paste mainnet secrets into this dashboard. Mainnet is intentionally disabled unless the environment configuration is explicitly overridden."
    >
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {MODULE_CAPABILITIES.map((m) => {
          const meta = MODULE_META[m.id];
          const disabled = m.state === "unavailable";
          return (
            <Card key={m.id} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className={`inline-block h-8 w-8 rounded-md ${meta.accent} opacity-90`} />
                <span className="text-mono-xs text-ink-500 dark:text-ink-400">{meta.count}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold tracking-tight">{m.label}</h3>
                <CapabilityBadge state={m.state} />
              </div>
              <p className="flex-1 text-sm text-ink-500 dark:text-ink-300">{m.description}</p>
              {m.docsHref && (
                <Link
                  href={m.docsHref}
                  className="text-mono-xs text-stellar-600 hover:underline dark:text-stellar-400"
                >
                  Feature readiness docs →
                </Link>
              )}
              {disabled ? (
                <Button variant="secondary" className="w-full" disabled>
                  Not available yet
                </Button>
              ) : (
                <Link href={meta.href}>
                  <Button variant="primary" className="w-full">
                    Open {m.label}
                  </Button>
                </Link>
              )}
            </Card>
          );
        })}
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
