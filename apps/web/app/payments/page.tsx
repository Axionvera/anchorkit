"use client";

import { useMemo, useState } from "react";
import { PageShell } from "@/components/PageShell";
import {
  Button,
  Card,
  Input,
  Label,
  Select,
  ValidationStateAlert,
  ValidationStateBadge,
} from "@/components/ui";
import {
  createPaymentIntent,
  createMockTransactionReceipt,
  evaluateTransactionReadinessSync,
  getStellarExpertAccountUrl,
  isPublicKeyValid,
  transactionReadinessStateToUiState,
} from "@anchorkit/stellar-kit";
import type { TransactionReadinessPipeline } from "@anchorkit/stellar-kit";
import type {
  AssetCode,
  MemoType,
  PaymentIntent,
  StellarAsset,
  StellarNetwork,
  StellarPublicKey,
  TransactionReceiptStatus,
} from "@anchorkit/types";
import { DEFAULT_NETWORK } from "@anchorkit/config";
import { TransactionReceiptPanel } from "@/components/TransactionReceiptPanel";
import { useDebouncedLoading } from "@/lib/useDebouncedLoading";

const FRIENDBOT = "GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR";
const DEMO_DEST = "GDQJUTQYK2MQ32ZGMMB7Q3UKTJLNTMZI2QYHW7OK2TK2DZI3X5IGQH6U";

export default function PaymentsPage() {
  const [source, setSource] = useState(FRIENDBOT);
  const [dest, setDest] = useState(DEMO_DEST);
  const [network, setNetwork] = useState<StellarNetwork>("testnet");
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
  const [mockReceiptStatus, setMockReceiptStatus] = useState<TransactionReceiptStatus>("pending");

  const mockReceipt = useMemo(
    () =>
      createMockTransactionReceipt({
        status: mockReceiptStatus,
        source: "payment",
        network: DEFAULT_NETWORK,
      }),
    [mockReceiptStatus]
  );

  const asset: StellarAsset = useMemo(() => {
    if (assetMode === "native") {
      return { type: "native", code: "XLM", issuer: null };
    }
    return {
      type: "issued",
      code: assetCode as AssetCode,
      issuer: assetIssuer as StellarPublicKey,
    };
  }, [assetMode, assetCode, assetIssuer]);

  const intent: PaymentIntent | null = useMemo(() => {
    const memo = memoType === "none" ? undefined : { type: memoType, value: memoValue };
    try {
      return createPaymentIntent({
        sourcePublicKey: source as StellarPublicKey,
        destinationPublicKey: dest as StellarPublicKey,
        asset,
        amount,
        memo,
      });
    } catch {
      return null;
    }
  }, [source, dest, asset, amount, memoType, memoValue]);

  const readiness: TransactionReadinessPipeline | null = useMemo(() => {
    if (!intent) return null;
    return evaluateTransactionReadinessSync(intent, {
      network,
      sourceAccountFunded:
        simulateSource === "funded" ? true : simulateSource === "unfunded" ? false : undefined,
      destAccountFunded:
        simulateDest === "funded" ? true : simulateDest === "unfunded" ? false : undefined,
    });
  }, [intent, network, simulateSource, simulateDest]);

  const readinessLoading = useDebouncedLoading(intent);

  return (
    <PageShell
      eyebrow="Payments"
      title="Payment intent builder & transaction readiness pipeline"
      subtitle="Compose a Stellar payment intent, validate input stages, and inspect typed transaction readiness states across the monorepo pipeline."
      warning="AnchorKit operates testnet-first and does not submit real payments. Readiness checks use the shared readiness pipeline."
    >
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-tight">Intent fields</h2>
            <div className="flex items-center gap-2">
              <Label htmlFor="net">Network</Label>
              <Select
                id="net"
                value={network}
                onChange={(e) => setNetwork(e.target.value as StellarNetwork)}
                className="py-1 text-xs"
              >
                <option value="testnet">Testnet (default)</option>
                <option value="mainnet">Mainnet (disabled by default)</option>
                <option value="futurenet">Futurenet</option>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="src" required>
                Source public key
              </Label>
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
                  onChange={(e) =>
                    setSimulateSource(e.target.value as "funded" | "unfunded" | "unknown")
                  }
                  className="mt-1"
                >
                  <option value="funded">Simulate: funded</option>
                  <option value="unfunded">Simulate: unfunded</option>
                  <option value="unknown">Simulate: unknown</option>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="dst" required>
                Destination public key
              </Label>
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
                  onChange={(e) =>
                    setSimulateDest(e.target.value as "funded" | "unfunded" | "unknown")
                  }
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
                  <Label htmlFor="code" required>
                    Asset code
                  </Label>
                  <Input
                    id="code"
                    value={assetCode}
                    onChange={(e) => setAssetCode(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="issuer" required>
                    Issuer (G…)
                  </Label>
                  <Input
                    id="issuer"
                    value={assetIssuer}
                    onChange={(e) => setAssetIssuer(e.target.value.trim())}
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="amount" required>
              Amount
            </Label>
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
          <h2 className="text-base font-semibold tracking-tight">Readiness pipeline result</h2>
          {!readiness ? (
            <ValidationStateAlert state="invalid" title="No valid intent">
              Fix the invalid fields above to generate a typed readiness report.
            </ValidationStateAlert>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-500 dark:text-ink-400">Overall State</span>
                <ValidationStateBadge
                  state={readinessLoading ? "loading" : transactionReadinessStateToUiState(readiness.state)}
                />
              </div>
              <p className="text-sm font-medium">{readiness.summary}</p>

              {/* 5-Stage Pipeline Breakdown */}
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                  Validation Stages
                </div>
                <div className="grid gap-2">
                  {Object.values(readiness.stages).map((stg) => (
                    <div
                      key={stg.stage}
                      className="flex items-center justify-between rounded-md border border-ink-200 p-2 text-xs dark:border-ink-800"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold uppercase">{stg.stage}</span>
                        <span className="text-ink-600 dark:text-ink-300">{stg.message}</span>
                      </div>
                      <ValidationStateBadge
                        state={readinessLoading ? "loading" : transactionReadinessStateToUiState(stg.state)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-1 text-sm font-medium">
                  Warnings ({readiness.warnings.length})
                </div>
                {readiness.warnings.length === 0 ? (
                  <p className="text-sm text-ink-500 dark:text-ink-400">
                    No warnings or blockers. Intent structure is fully valid.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {readiness.issues.map((w) => (
                      <li
                        key={w.code}
                        className={`rounded-md border px-3 py-2 text-sm ${
                          w.severity === "error"
                            ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"
                            : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
                        }`}
                      >
                        <span className="font-semibold text-mono-xs uppercase tracking-wider">
                          [{w.stage}] {w.severity} · {w.code}
                        </span>
                        <div className="mt-0.5">{w.message}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-lg border border-ink-200 p-3 text-sm dark:border-ink-800">
                <div className="mb-2 font-medium">Review links ({network})</div>
                <div className="flex flex-wrap gap-2 text-mono-xs">
                  {isPublicKeyValid(source) && (
                    <a
                      href={getStellarExpertAccountUrl(source, network) ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      Source on Expert ↗
                    </a>
                  )}
                  {isPublicKeyValid(dest) && (
                    <a
                      href={getStellarExpertAccountUrl(dest, network) ?? "#"}
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
                config and after reviewing security notes.
              </p>
            </>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="text-base font-semibold tracking-tight">Mock transaction receipt</h2>
          <p className="text-sm text-ink-500 dark:text-ink-400">
            Preview the normalized receipt model for each post-submit outcome. The MVP does not
            submit real transactions — this selector demonstrates the shared receipt UI.
          </p>
          <div>
            <Label>Receipt status</Label>
            <Select
              value={mockReceiptStatus}
              onChange={(e) => setMockReceiptStatus(e.target.value as TransactionReceiptStatus)}
            >
              {(["confirmed", "pending", "failed", "rejected", "unknown"] as const).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
        </Card>
        <TransactionReceiptPanel receipt={mockReceipt} title="Payment receipt preview" />
      </div>
    </PageShell>
  );
}
