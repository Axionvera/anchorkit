import clsx from "clsx";
import type {
  AnchorTransactionStatus,
  MilestoneStatus,
  TransactionReceiptStatus,
  CapabilityState,
} from "@anchorkit/types";
import {
  badgeClasses,
  alertClasses,
  getAnchorSeverity,
  getMilestoneSeverity,
  getReceiptSeverity,
  getAccountSeverity,
} from "@anchorkit/stellar-kit";

/**
 * Renders an anchor transaction status badge using the shared
 * {@link getAnchorSeverity} mapping from `@anchorkit/stellar-kit`.
 *
 * The colour scheme is derived from the badge's `tone` so there is a single
 * source of truth for status labelling and styling.
 */
export function AnchorStatusBadge({ status }: { status: AnchorTransactionStatus }) {
  const { label, tone } = getAnchorSeverity(status);

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-mono-xs font-medium",
        badgeClasses(tone)
      )}
    >
      <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
}

export function MilestoneStatusBadge({ status }: { status: MilestoneStatus }) {
  const { label, tone } = getMilestoneSeverity(status);

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-mono-xs font-medium",
        badgeClasses(tone)
      )}
    >
      {label}
    </span>
  );
}

export function TransactionReceiptBadge({ status }: { status: TransactionReceiptStatus }) {
  const { label, tone } = getReceiptSeverity(status);

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-mono-xs font-medium",
        badgeClasses(tone)
      )}
    >
      <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
}

export function AccountStatusBadge({
  status,
}: {
  status: "funded" | "unfunded" | "unknown" | "error" | "checking";
}) {
  const severity = getAccountSeverity(status === "checking" ? "unknown" : status);
  const label = status === "checking" ? "Checking…" : severity.label;
  const tone = severity.tone;

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-mono-xs font-medium",
        badgeClasses(tone)
      )}
    >
      {label}
    </span>
  );
}

export function Alert({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "warning" | "error" | "success";
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={clsx("rounded-lg border px-4 py-3 text-sm", alertClasses(tone))}>
      {title && <p className="mb-1 font-semibold">{title}</p>}
      <div>{children}</div>
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-ink-200 bg-white p-6 shadow-sm dark:border-ink-800 dark:bg-ink-950",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const variants = {
    primary:
      "bg-stellar-600 text-white hover:bg-stellar-700 border border-stellar-600 disabled:opacity-50",
    secondary:
      "bg-white text-ink-800 border border-ink-300 hover:bg-ink-50 disabled:opacity-50 dark:bg-ink-950 dark:text-ink-100 dark:border-ink-700 dark:hover:bg-ink-900",
    ghost:
      "bg-transparent text-ink-700 hover:bg-ink-100 border border-transparent dark:text-ink-200 dark:hover:bg-ink-900",
    danger: "bg-red-600 text-white hover:bg-red-700 border border-red-600 disabled:opacity-50",
  };
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stellar-600",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export function Label({
  htmlFor,
  children,
  required,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-medium text-ink-800 dark:text-ink-200"
    >
      {children}
      {required && <span className="ml-1 text-red-500">*</span>}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        "w-full rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-stellar-500 focus:ring-2 focus:ring-stellar-500/20 disabled:bg-ink-50 disabled:text-ink-500 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-50 dark:placeholder:text-ink-500 dark:disabled:bg-ink-900",
        props.className ?? ""
      )}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={clsx(
        "w-full rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-stellar-500 focus:ring-2 focus:ring-stellar-500/20 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-50 dark:placeholder:text-ink-500",
        props.className ?? ""
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={clsx(
        "w-full rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900 focus:border-stellar-500 focus:ring-2 focus:ring-stellar-500/20 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-50",
        props.className ?? ""
      )}
    />
  );
}

export function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <dt className="text-ink-500 shrink-0 dark:text-ink-400">{label}</dt>
      <dd className="text-right text-ink-900 dark:text-ink-100">{value}</dd>
    </div>
  );
}

export const CAPABILITY_BADGE_STYLES: Record<CapabilityState, string> = {
  implemented:
    "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900",
  mock: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900",
  "testnet-only":
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
  experimental:
    "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900",
  unavailable:
    "bg-ink-100 text-ink-700 border-ink-200 dark:bg-ink-900 dark:text-ink-300 dark:border-ink-800",
};

export const CAPABILITY_BADGE_LABELS: Record<CapabilityState, string> = {
  implemented: "Implemented",
  mock: "Mock only",
  "testnet-only": "Testnet only",
  experimental: "Experimental",
  unavailable: "Unavailable",
};

export function CapabilityBadge({ state }: { state: CapabilityState }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-mono-xs font-medium",
        CAPABILITY_BADGE_STYLES[state]
      )}
    >
      <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {CAPABILITY_BADGE_LABELS[state]}
    </span>
  );
}
