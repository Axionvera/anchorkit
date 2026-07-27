"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/accounts", label: "Accounts" },
  { href: "/payments", label: "Payments" },
  { href: "/anchors", label: "Anchors" },
  { href: "/escrow", label: "Escrow" },
  { href: "/docs", label: "Docs" },
];

export function ShellNavbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-ink-200 bg-white/90 backdrop-blur dark:border-ink-800 dark:bg-ink-950/90">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-stellar-500 via-soroban-500 to-anchor-500 text-white shadow-sm">
            <span className="text-mono-sm font-bold">AK</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-semibold tracking-tight">AnchorKit</span>
            <span className="text-mono-xs text-ink-500">Stellar Testnet Dev Kit</span>
          </div>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-stellar-50 text-stellar-700 font-medium dark:bg-stellar-900/40 dark:text-stellar-300"
                    : "text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-900"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-mono-xs font-medium text-amber-700 sm:inline-block dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300">
            Testnet Only
          </span>
          <Link
            href="/docs"
            className="rounded-md border border-ink-200 px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50 dark:border-ink-800 dark:text-ink-200 dark:hover:bg-ink-900"
          >
            Docs
          </Link>
        </div>
      </div>
      <div className="border-t border-ink-200 px-4 py-2 md:hidden dark:border-ink-800 sm:px-6 lg:px-8">
        <nav className="flex flex-wrap gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "rounded-md px-3 py-1.5 text-sm",
                  active
                    ? "bg-stellar-50 text-stellar-700 dark:bg-stellar-900/40 dark:text-stellar-300"
                    : "text-ink-700 dark:text-ink-200"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
