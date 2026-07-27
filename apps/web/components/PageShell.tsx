"use client";

import { ReactNode } from "react";
import { ShellNavbar } from "./ShellNavbar";

export function PageShell({
  children,
  title,
  eyebrow,
  subtitle,
  warning,
}: {
  children: ReactNode;
  title: string;
  eyebrow?: string;
  subtitle?: string;
  warning?: string;
}) {
  return (
    <div className="min-h-screen">
      <ShellNavbar />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-8 space-y-4">
          {eyebrow && (
            <div className="text-mono-xs uppercase tracking-widest text-stellar-600 dark:text-stellar-400">
              {eyebrow}
            </div>
          )}
          <h1 className="text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl dark:text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="max-w-3xl text-base text-ink-500 sm:text-lg dark:text-ink-300">
              {subtitle}
            </p>
          )}
          {warning && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
              <span className="font-semibold">Warning — </span>
              {warning}
            </div>
          )}
        </section>
        <section className="space-y-6">{children}</section>
      </main>
      <footer className="mt-16 border-t border-ink-200 py-8 dark:border-ink-800">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-3 px-4 text-sm text-ink-500 sm:flex-row sm:items-center sm:px-6 lg:px-8 dark:text-ink-400">
          <p>
            AnchorKit · Apache-2.0 · Open source under{" "}
            <span className="text-mono-xs">stellar-commons-labs</span>
          </p>
          <p className="text-mono-xs">
            Built for Stellar testnet developers · Never custody real funds in the MVP.
          </p>
        </div>
      </footer>
    </div>
  );
}
