import clsx from "clsx";
import type { AnchorTransactionStatus, MilestoneStatus, TransactionReceiptStatus } from "@anchorkit/types";
import { receiptStatusBadge } from "@anchorkit/stellar-kit";
import { anchorStatusBadge } from "@anchorkit/anchor-utils";

/**
 * Renders an anchor transaction status badge using the shared
 * {@link anchorStatusBadge} mapping from `@anchorkit/anchor-utils`.
 *
 * The colour scheme is derived from the badge's `tone` so there is a single
 * source of truth for status labelling and styling.
 */
export function AnchorStatusBadge({ status }: { status: AnchorTransactionStatus }) {
  const { label, tone } = anchorStatusBadge(status);

  const toneStyles: Record<string, string> = {
    neutral: "bg-ink-100 text-ink-700 border-ink-200 dark:bg-ink-900 dark:text-ink-300 dark:border-ink-800",
    amber: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
    blue: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900",
    green: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900",
    red: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-mono-xs font-medium",
        toneStyles[tone] ?? toneStyles.blue,
      )}
    >
      <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
}

export function MilestoneStatusBadge({ status }: { status: MilestoneStatus }) {
  const styles: Record<MilestoneStatus, string> = {
    draft: "bg-ink-100 text-ink-700 border-ink-200 dark:bg-ink-900 dark:text-ink-300 dark:border-ink-800",
    active: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900",
    evidence_submitted: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-900",
    approved: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900",
    disputed: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900",
    ready_for_release: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
    released: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-900",
  };
  const label: Record<MilestoneStatus, string> = {
    draft: "Draft",
    active: "Active",
    evidence_submitted: "Evidence Submitted",
    approved: "Approved",
    disputed: "Disputed",
    ready_for_release: "Ready for Release",
    released: "Released",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-mono-xs font-medium",
        styles[status]
      )}
    >
      {label[status]}
    </span>
  );
}

const RECEIPT_BADGE_STYLES: Record<
  ReturnType<typeof receiptStatusBadge>["tone"],
  string
> = {
  green: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900",
  blue: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900",
  red: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900",
  amber: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
  neutral: "bg-ink-100 text-ink-700 border-ink-200 dark:bg-ink-900 dark:text-ink-300 dark:border-ink-800",
};

export function TransactionReceiptBadge({ status }: { status: TransactionReceiptStatus }) {
  const badge = receiptStatusBadge(status);
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-mono-xs font-medium",
        RECEIPT_BADGE_STYLES[badge.tone]
      )}
    >
      <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {badge.label}
    </span>
  );
}

export function AccountStatusBadge({ status }: { status: "funded" | "unfunded" | "unknown" | "error" | "checking" }) {
  const map = {
    funded: { label: "Funded", cls: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900" },
    unfunded: { label: "Unfunded", cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900" },
    unknown: { label: "Unknown", cls: "bg-ink-100 text-ink-700 border-ink-200 dark:bg-ink-900 dark:text-ink-300 dark:border-ink-800" },
    error: { label: "Error", cls: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900" },
    checking: { label: "Checking…", cls: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900" },
  } as const;
  const s = map[status];
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-mono-xs font-medium",
        s.cls
      )}
    >
      {s.label}
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
  const map = {
    info: "border-stellar-200 bg-stellar-50 text-stellar-800 dark:border-stellar-900 dark:bg-stellar-950/40 dark:text-stellar-200",
    warning: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200",
    error: "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200",
    success: "border-anchor-100 bg-anchor-50 text-anchor-700 dark:border-anchor-900 dark:bg-anchor-950/30 dark:text-anchor-200",
  } as const;
  return (
    <div className={clsx("rounded-lg border px-4 py-3 text-sm", map[tone])}>
      {title && <p className="mb-1 font-semibold">{title}</p>}
      <div>{children}</div>
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
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
    primary: "bg-stellar-600 text-white hover:bg-stellar-700 border border-stellar-600 disabled:opacity-50",
    secondary: "bg-white text-ink-800 border border-ink-300 hover:bg-ink-50 disabled:opacity-50 dark:bg-ink-950 dark:text-ink-100 dark:border-ink-700 dark:hover:bg-ink-900",
    ghost: "bg-transparent text-ink-700 hover:bg-ink-100 border border-transparent dark:text-ink-200 dark:hover:bg-ink-900",
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

export function Label({ htmlFor, children, required }: { htmlFor?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink-800 dark:text-ink-200">
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
