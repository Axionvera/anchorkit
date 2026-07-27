"use client";

import { useMemo, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { Alert, Button, Card, Input, Label, Select, DataRow } from "@/components/ui";
import {
  createPaymentIntent,
  estimateTransactionReadinessSync,
  getStellarExpertAccountUrl,
  isPublicKeyValid,
} from "@anchorkit/stellar-kit";
import type { MemoType, PaymentIntent, StellarAsset, TransactionReadiness } from "@anchorkit/types";
import { DEFAULT_NETWORK } from "@anchorkit/config";

const FRIENDBOT = "GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR";
const DEMO_DEST = "GDQJUTQYK2MQ32ZGMMB7Q3UKTJLNTMZI2QYHW7OK2TK2DZI3X5IGQH6U";

export default function PaymentsPage() {
  const [source, setSource] = useState(FRIENDBOT);
  const [dest, setDest] = useState(DEMO_DEST);
  const [assetMode, setAssetMode] = useState<"native" | "issued">("native");
  const [assetCode, setAssetCode] = useState("USDC");
  const [assetIssuer, setAssetIssuer] = useState(
    "GDQJUTQYK2MQ32ZGMMB7Q3UKTJLNTMZI2QYHW7OK2TK2DZI3X5IGQH6U"
  );
  const [amount, setAmount] = useState("100.5000000");
  const [memoType, setMemoType] = useState<MemoType>("text");
  const [memoValue, setMemoValue] = useState("Invoice #42");

  const [simulateSource, setSimulateSource] = useState<"funded" | "unfunded" | "unknown">("funded");
  const [simulateDest, setSimulateDest] = useState<"funded" | "unfunded" | "unknown">("funded");

  const asset: StellarAsset = useMemo(() => {
    if (assetMode === "native") {
      return { type: "native", code: "XLM", issuer: null };
    }
    return {
      type: "issued",
      code: assetCode as any,
      issuer: assetIssuer as any,
    };
  }, [assetMode, assetCode, assetIssuer]);

  const memo = memoType === "none" ? undefined : { type: memoType, value: memoValue };

  const intent: PaymentIntent | null = useMemo(() => {
    try {
      return createPaymentIntent({
        sourcePublicKey: source as any,
        destinationPublicKey: dest as any,
        asset,
        amount,
        memo,
      });
    } catch {
      return null;
    }
  }, [source, dest, asset, amount, memo]);

  const readiness: TransactionReadiness | null = useMemo(() => {
    if (!intent) return null;
    return estimateTransactionReadinessSync(intent, {
      network: DEFAULT_NETWORK,
      sourceAccountFunded:
        simulateSource === "funded"
          ? true
          : simulateSource === "unfunded"
            ? false
            : undefined,
      destAccountFunded:
        simulateDest === "funded"
          ? true
          : simulateDest === "unfunded"
            ? false
            : undefined,
    });
  }, [intent, simulateSource, simulateDest]);

  return (
    <PageShell
      eyebrow="Payments"
      title="Payment intent builder & readiness"
      subtitle="Compose a basic payment intent, validate each field, and inspect typed readiness warnings before any network call is made."
      warning="The MVP does not submit real Stellar transactions. Readiness checks use simulated account statuses by default. A testnet-only mock submit toggle can be wired in by contributors."
    >
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 space-y-4">
          <h2 className="text-base font-semibold tracking-tight">Intent fields</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="src" required>Source public key</Label>
              <Input
                id="src"
                value={source}
                onChange={(e) => setSource(e.target.value.trim())}
                placeholder="G…"
              />
              <div className="mt-1 flex items-center justify-between text-mono-xs text-ink-500 dark:text-ink-400">
                <span>{isPublicKeyValid(source) ? "Format OK" : "Invalid format"}</span>
                <Select
                  value={simulateSource}
                  onChange={(e) => setSimulateSource(e.target.value as any)}
                  className="mt-1"
                >
                  <option value="funded">Simulate: funded</option>
                  <option value="unfunded">Simulate: unfunded</option>
                  <option value="unknown">Simulate: unknown</option>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="dst" required>Destination public key</Label>
              <Input
                id="dst"
                value={dest}
                onChange={(e) => setDest(e.target.value.trim())}
                placeholder="G…"
              />
              <div className="mt-1 flex items-center justify-between text-mono-xs text-ink-500 dark:text-ink-400">
                <span>{isPublicKeyValid(dest) ? "Format OK" : "Invalid format"}</span>
                <Select
                  value={simulateDest}
                  onChange={(e) => setSimulateDest(e.target.value as any)}
                  className="mt-1"
                >
                  <option value="funded">Simulate: funded</option>
                  <option value="unfunded">Simulate: unfunded</option>
                  <option value="unknown">Simulate: unknown</option>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <Label required>Asset</Label>
            <div className="flex gap-2">
              <button
                onClick={() => setAssetMode("native")}
                className={`rounded-md border px-3 py-2 text-sm ${
                  assetMode === "native"
                    ? "border-stellar-500 bg-stellar-50 text-stellar-700 dark:bg-stellar-950/40 dark:text-stellar-300"
                    : "border-ink-300 dark:border-ink-700"
                }`}
              >
                Native XLM
              </button>
              <button
                onClick={() => setAssetMode("issued")}
                className={`rounded-md border px-3 py-2 text-sm ${
                  assetMode === "issued"
                    ? "border-stellar-500 bg-stellar-50 text-stellar-700 dark:bg-stellar-950/40 dark:text-stellar-300"
                    : "border-ink-300 dark:border-ink-700"
                }`}
              >
                Issued asset (CODE:ISSUER)
              </button>
            </div>
            {assetMode === "issued" && (
              <div className="mt-2 grid gap-3 md:grid-cols-2">
                <div>
                  <Label htmlFor="code" required>Asset code</Label>
                  <Input id="code" value={assetCode} onChange={(e) => setAssetCode(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="issuer" required>Issuer (G…)</Label>
                  <Input id="issuer" value={assetIssuer} onChange={(e) => setAssetIssuer(e.target.value.trim())} />
                </div>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="amount" required>Amount</Label>
            <Input
              id="amount"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 100.5000000 (max 7 decimals, >0)"
            />
          </div>

          <div>
            <Label>Memo (optional)</Label>
            <div className="grid gap-3 md:grid-cols-[200px_1fr]">
              <Select value={memoType} onChange={(e) => setMemoType(e.target.value as MemoType)}>
                <option value="none">none</option>
                <option value="text">text (28 bytes)</option>
                <option value="id">id (uint64 string)</option>
                <option value="hash">hash (64 hex)</option>
                <option value="return">return (64 hex)</option>
              </Select>
              <Input
                value={memoValue}
                onChange={(e) => setMemoValue(e.target.value)}
                disabled={memoType === "none"}
                placeholder={
                  memoType === "none"
                    ? "memo disabled"
                    : memoType === "id"
                      ? "numeric id"
                      : memoType === "hash" || memoType === "return"
                        ? "64 hex chars"
                        : "human-readable memo"
                }
              />
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-semibold tracking-tight">Readiness result</h2>
          {!readiness ? (
            <Alert tone="warning" title="No intent yet">
              Fix the invalid fields above to generate a typed readiness report.
            </Alert>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-500 dark:text-ink-400">Overall</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-mono-xs font-medium ${
                    readiness.ready
                      ? "bg-green-100 text-green-700 border border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900"
                      : "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900"
                  }`}
                >
                  {readiness.ready ? "Ready" : "Not ready"}
                </span>
              </div>
              <p className="text-sm">{readiness.summary}</p>
              <div>
                <div className="mb-1 text-sm font-medium">Warnings ({readiness.warnings.length})</div>
                {readiness.warnings.length === 0 ? (
                  <p className="text-sm text-ink-500 dark:text-ink-400">
                    No warnings. Intent structure looks good.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {readiness.warnings.map((w) => (
                      <li
                        key={w.code}
                        className={`rounded-md border px-3 py-2 text-sm ${
                          w.severity === "error"
                            ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"
                            : w.severity === "warning"
                              ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
                              : "border-ink-200 bg-ink-50 text-ink-700 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-200"
                        }`}
                      >
                        <span className="font-semibold text-mono-xs uppercase tracking-wider">
                          {w.severity} · {w.code}
                        </span>
                        <div className="mt-0.5">{w.message}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="rounded-lg border border-ink-200 p-3 text-sm dark:border-ink-800">
                <div className="mb-2 font-medium">Review links (testnet)</div>
                <div className="flex flex-wrap gap-2 text-mono-xs">
                  {isPublicKeyValid(source) && (
                    <a
                      href={getStellarExpertAccountUrl(source, "testnet") ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      Source on Expert ↗
                    </a>
                  )}
                  {isPublicKeyValid(dest) && (
                    <a
                      href={getStellarExpertAccountUrl(dest, "testnet") ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      Dest on Expert ↗
                    </a>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="primary" disabled={!readiness.ready}>
                  Simulate submission (mock)
                </Button>
                <Button variant="secondary" disabled={!intent}>
                  Copy intent JSON
                </Button>
              </div>
              <p className="text-mono-xs text-ink-500 dark:text-ink-400">
                Note: mainnet mode is explicitly disabled by default. Override only in advanced
                config and after reviewing the security notes.
              </p>
            </>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
