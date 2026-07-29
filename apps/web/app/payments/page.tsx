"use client";

import { useMemo, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { Alert, Button, Card, Input, Label, Select, Textarea } from "@/components/ui";
import {
  createPaymentIntent,
  createMockTransactionReceipt,
  estimateTransactionReadinessSync,
  getStellarExpertAccountUrl,
  isPublicKeyValid,
  parsePaymentRequest,
} from "@anchorkit/stellar-kit";
import type {
  AssetCode,
  MemoType,
  PaymentIntent,
  StellarAsset,
  StellarNetwork,
  StellarPublicKey,
  TransactionReadiness,
  TransactionReceiptStatus,
} from "@anchorkit/types";
import { DEFAULT_NETWORK } from "@anchorkit/config";
import { TransactionReceiptPanel } from "@/components/TransactionReceiptPanel";

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
  const [network, setNetwork] = useState<StellarNetwork>(DEFAULT_NETWORK);
  const [requestJson, setRequestJson] = useState("");
  const [requestFeedback, setRequestFeedback] = useState<{
    tone: "error" | "success";
    title: string;
    message: string;
  } | null>(null);

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

  const memo = useMemo(
    () => (memoType === "none" ? undefined : { type: memoType, value: memoValue }),
    [memoType, memoValue]
  );

  const intent: PaymentIntent | null = useMemo(() => {
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
  }, [source, dest, asset, amount, memo]);

  const readiness: TransactionReadiness | null = useMemo(() => {
    if (!intent) return null;
    return estimateTransactionReadinessSync(intent, {
      network,
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
  }, [intent, network, simulateSource, simulateDest]);

  function applyPaymentRequest() {
    const result = parsePaymentRequest(requestJson);
    if (!result.success) {
      const firstIssue = result.error.issues?.[0];
      setRequestFeedback({
        tone: "error",
        title: result.error.code,
        message: firstIssue
          ? `${firstIssue.path || "request"}: ${firstIssue.message}`
          : result.error.message,
      });
      return;
    }

    const request = result.data;
    setDest(request.destination);
    setAmount(request.amount);
    setNetwork(request.network);
    if (request.asset.type === "native") {
      setAssetMode("native");
    } else {
      setAssetMode("issued");
      setAssetCode(request.asset.code);
      setAssetIssuer(request.asset.issuer);
    }
    if (request.memo) {
      setMemoType(request.memo.type);
      setMemoValue(request.memo.value);
    } else {
      setMemoType("none");
      setMemoValue("");
    }
    setRequestFeedback({
      tone: "success",
      title: "Payment request applied",
      message: `Loaded a ${request.network} request${
        request.expiresAt ? ` expiring ${request.expiresAt}` : ""
      }. Review the intent and readiness checks before continuing.`,
    });
  }

  return (
    <PageShell
      eyebrow="Payments"
      title="Payment request, intent builder & readiness"
      subtitle="Import a versioned payment request or compose an intent manually, then inspect typed readiness warnings before any network call is made."
      warning="The MVP does not submit real Stellar transactions. Readiness checks use simulated account statuses by default. A testnet-only mock submit toggle can be wired in by contributors."
    >
      <Card className="space-y-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Import payment request</h2>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            Paste an AnchorKit version 1 JSON request. Valid fields are applied to the intent
            builder; expired, malformed, and unsupported requests are rejected with typed errors.
          </p>
        </div>
        <div>
          <Label htmlFor="payment-request-json">Payment request JSON</Label>
          <Textarea
            id="payment-request-json"
            rows={7}
            value={requestJson}
            onChange={(event) => setRequestJson(event.target.value)}
            placeholder='{"version":"1","destination":"G…","amount":"10.0000000","asset":{"type":"native","code":"XLM","issuer":null},"network":"testnet"}'
            className="font-mono"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="secondary" onClick={applyPaymentRequest}>
            Parse & apply request
          </Button>
          <span className="text-mono-xs text-ink-500 dark:text-ink-400">
            Active network: {network}
          </span>
        </div>
        {requestFeedback && (
          <Alert tone={requestFeedback.tone} title={requestFeedback.title}>
            {requestFeedback.message}
          </Alert>
        )}
      </Card>

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
                  onChange={(e) => setSimulateSource(e.target.value as "funded" | "unfunded" | "unknown")}
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
                  onChange={(e) => setSimulateDest(e.target.value as "funded" | "unfunded" | "unknown")}
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
                    readiness.state === "ready"
                      ? "bg-green-100 text-green-700 border border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900"
                      : readiness.state === "warnings"
                        ? "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900"
                        : readiness.state === "unsafe-network"
                          ? "bg-red-100 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900"
                          : "bg-red-100 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900"
                  }`}
                >
                  {readiness.state === "ready"
                    ? "Ready"
                    : readiness.state === "warnings"
                      ? "Ready (with warnings)"
                      : readiness.state === "unsafe-network"
                        ? "Unsafe network"
                        : "Blocked"}
                </span>
              </div>
              <p className="text-sm">{readiness.summary}</p>
              <div>
                <div className="mb-1 text-sm font-medium">Validation stages</div>
                <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  {readiness.stages.map((s) => (
                    <li
                      key={s.id}
                      className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-mono-xs ${
                        s.status === "pass"
                          ? "border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950/30 dark:text-green-200"
                          : s.status === "warn"
                            ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
                            : "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-1.5 w-1.5 rounded-full ${
                          s.status === "pass"
                            ? "bg-green-500"
                            : s.status === "warn"
                              ? "bg-amber-500"
                              : "bg-red-500"
                        }`}
                      />
                      {s.label}
                    </li>
                  ))}
                </ul>
              </div>
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
