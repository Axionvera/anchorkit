"use client";

import { useState } from "react";
import { DEFAULT_NETWORK } from "@anchorkit/config";
import { PageShell } from "@/components/PageShell";
import {
  Alert,
  Button,
  Card,
  Input,
  Label,
  AccountStatusBadge,
  DataRow,
} from "@/components/ui";
import {
  generateTestnetKeypair,
  isPublicKeyValid,
  validateSecretKeyQuietly,
  secretKeyToRedactedString,
  getStellarExpertAccountUrl,
  getTestnetFriendbotUrl,
  getPublicKeyFromSecret,
  parseTransactionHash,
  buildTransactionLink,
  diagnoseAccount,
  type AccountDiagnostic,
} from "@anchorkit/stellar-kit";
import type {
  StellarKeypair,
  AccountInfo,
  StellarSecretKey,
  AccountStatus,
} from "@anchorkit/types";

type LastGen = StellarKeypair & { shown: boolean };

export default function AccountsPage() {
  const [lookupKey, setLookupKey] = useState("");
  const [lookupStatus, setLookupStatus] = useState<AccountStatus>("unknown");
  const [lookupInfo, setLookupInfo] = useState<AccountInfo | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  const [validateInput, setValidateInput] = useState("");
  const [validateMode, setValidateMode] = useState<"public" | "secret">("public");

  const [lastGen, setLastGen] = useState<LastGen | null>(null);

  const [lookupDiag, setLookupDiag] = useState<AccountDiagnostic | null>(null);

  const [txHashInput, setTxHashInput] = useState("");
  const txParse = txHashInput.trim()
    ? parseTransactionHash(txHashInput.trim(), DEFAULT_NETWORK)
    : null;

  const expertUrl = isPublicKeyValid(lookupKey)
    ? getStellarExpertAccountUrl(lookupKey, DEFAULT_NETWORK)
    : null;
  const friendbot = isPublicKeyValid(lookupKey)
    ? getTestnetFriendbotUrl(lookupKey)
    : null;

  async function handleLookup() {
    if (!isPublicKeyValid(lookupKey)) {
      setLookupInfo(null);
      setLookupStatus("unknown");
      setLookupDiag(null);
      return;
    }
    setLookupLoading(true);
    try {
      const diag = await diagnoseAccount(lookupKey, { network: DEFAULT_NETWORK });
      setLookupDiag(diag);
      setLookupInfo(diag.account);
      setLookupStatus(diag.state === "invalid" ? "unknown" : (diag.state as AccountStatus));
    } catch {
      setLookupInfo(null);
      setLookupStatus("error");
      setLookupDiag(null);
    } finally {
      setLookupLoading(false);
    }
  }

  function handleGenerate() {
    const kp = generateTestnetKeypair();
    setLastGen({ ...kp, shown: true });
  }

  const validationResult =
    validateMode === "public"
      ? isPublicKeyValid(validateInput)
      : validateSecretKeyQuietly(validateInput).valid;

  return (
    <PageShell
      eyebrow="Accounts"
      title="Stellar account tools"
      subtitle="Generate testnet keypairs, validate public or secret keys locally, and check an account&apos;s funded status against Stellar Horizon."
      warning="Secret keys generated on this page are for local demos only. Never use a mainnet secret here. After initial display, the secret is always shown redacted on rerenders in this MVP."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-base font-semibold tracking-tight">
            Generate a testnet keypair
          </h2>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-300">
            Generates a fresh random keypair suitable for Stellar testnet development. Secret is
            only shown once on creation.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <Button variant="primary" onClick={handleGenerate}>
              Generate Testnet Keypair
            </Button>
            {lastGen && (
              <Button
                variant="ghost"
                onClick={() =>
                  setLastGen({ ...lastGen, shown: !lastGen.shown })
                }
              >
                {lastGen.shown ? "Hide secret" : "Reveal secret (demo only)"}
              </Button>
            )}
          </div>
          {lastGen && (
            <div className="mt-4 rounded-lg border border-ink-200 p-4 text-sm dark:border-ink-800">
              <dl className="divide-y divide-ink-100 dark:divide-ink-800">
                <DataRow
                  label="Public key"
                  value={
                    <div className="text-right">
                      <div className="text-mono-sm hash-clip">{lastGen.publicKey}</div>
                      <a
                        href={
                          getStellarExpertAccountUrl(lastGen.publicKey, "testnet") ?? "#"
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="text-mono-xs text-stellar-600 hover:underline dark:text-stellar-400"
                      >
                        View on Stellar Expert ↗
                      </a>
                    </div>
                  }
                />
                <DataRow
                  label="Secret key"
                  value={
                    <div className="text-right">
                      <div
                        className={`text-mono-sm ${
                          lastGen.shown ? "text-red-700 dark:text-red-300" : ""
                        }`}
                      >
                        {lastGen.shown ? (
                          lastGen.secretKey
                        ) : (
                          <span>{secretKeyToRedactedString(lastGen.secretKey)}</span>
                        )}
                      </div>
                      <div className="mt-0.5 text-mono-xs text-amber-600 dark:text-amber-300">
                        Local demo only — never reuse on mainnet.
                      </div>
                    </div>
                  }
                />
                <DataRow
                  label="Funding hint"
                  value={
                    <a
                      href={getTestnetFriendbotUrl(lastGen.publicKey) ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="text-mono-xs text-stellar-600 hover:underline dark:text-stellar-400"
                    >
                      Open Friendbot to fund ↗
                    </a>
                  }
                />
              </dl>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-base font-semibold tracking-tight">Validate a key locally</h2>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-300">
            Structural validation only — runs in the browser and does not touch the network.
            Secret input is never logged or echoed verbatim.
          </p>
          <div className="mt-4 space-y-3">
            <div>
              <Label>Validation mode</Label>
              <div className="flex gap-2">
                {(["public", "secret"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setValidateMode(mode)}
                    className={`rounded-md border px-3 py-1.5 text-sm ${
                      validateMode === mode
                        ? "border-stellar-500 bg-stellar-50 text-stellar-700 dark:bg-stellar-950/40 dark:text-stellar-300"
                        : "border-ink-300 dark:border-ink-700"
                    }`}
                  >
                    {mode === "public" ? "Public key" : "Secret key"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="validate-input">
                {validateMode === "public" ? "Public key (G…)" : "Secret key (S…)"}
              </Label>
              <Input
                id="validate-input"
                type={validateMode === "secret" ? "password" : "text"}
                value={validateInput}
                onChange={(e) => setValidateInput(e.target.value)}
                placeholder={
                  validateMode === "public"
                    ? "GA… 56 characters"
                    : "SC… 56 characters (input is never echoed)"
                }
              />
            </div>
            {validateInput.length > 0 && (
              <Alert tone={validationResult ? "success" : "error"} title={validationResult ? "Valid key" : "Invalid key"}>
                {validationResult ? (
                  <div>
                    {validateMode === "public" ? (
                      <>
                        <p>Matches Stellar public key format (56 chars, G prefix, base32).</p>
                        {isPublicKeyValid(validateInput) && (
                          <a
                            href={getStellarExpertAccountUrl(validateInput, DEFAULT_NETWORK) ?? "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-block text-mono-xs text-stellar-600 underline dark:text-stellar-400"
                          >
                            Open in Stellar Expert ↗
                          </a>
                        )}
                      </>
                    ) : (
                      <>
                        <p>Matches Stellar secret key format (56 chars, S prefix, base32).</p>
                        <p className="mt-1 text-mono-xs text-amber-700 dark:text-amber-300">
                          Corresponding public (derived locally){" "}
                          <span className="text-mono-sm">
                            {(() => {
                              try {
                                return getPublicKeyFromSecret(
                                  validateInput as StellarSecretKey
                                );
                              } catch {
                                return "could not derive";
                              }
                            })()}
                          </span>
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <p>
                    Check length, prefix (G/S), and that only characters A–Z and digits 2–7 are
                    used.
                  </p>
                )}
              </Alert>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight">
              Check account funded status
            </h2>
            <p className="mt-1 text-sm text-ink-500 dark:text-ink-300">
              Looks up a public key against Stellar testnet Horizon. Returns funded, unfunded,
              unknown (network error), or error.
            </p>
          </div>
          <AccountStatusBadge status={lookupLoading ? "checking" : lookupStatus} />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
          <div>
            <Label htmlFor="lookup-key">Stellar public key</Label>
            <Input
              id="lookup-key"
              value={lookupKey}
              onChange={(e) => setLookupKey(e.target.value.trim())}
              placeholder="GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR"
            />
          </div>
          <div className="flex items-end gap-2">
            <Button variant="primary" onClick={handleLookup} disabled={lookupLoading || !isPublicKeyValid(lookupKey)}>
              {lookupLoading ? "Checking…" : "Check Status"}
            </Button>
          </div>
        </div>
        {lookupInfo && (
          <div className="mt-4 rounded-lg border border-ink-200 p-4 text-sm dark:border-ink-800">
            <dl className="divide-y divide-ink-100 dark:divide-ink-800">
              <DataRow label="Status" value={<AccountStatusBadge status={lookupInfo.status} />} />
              <DataRow
                label="Public key"
                value={<span className="text-mono-sm hash-clip">{lookupInfo.publicKey}</span>}
              />
              {lookupInfo.sequence !== undefined && (
                <DataRow
                  label="Sequence number"
                  value={<span className="text-mono-sm">{lookupInfo.sequence}</span>}
                />
              )}
              {lookupInfo.subentryCount !== undefined && (
                <DataRow label="Subentries" value={lookupInfo.subentryCount} />
              )}
              {lookupInfo.lastModifiedLedger !== undefined && (
                <DataRow label="Last modified ledger" value={lookupInfo.lastModifiedLedger} />
              )}
              {lookupInfo.balances && (
                <div className="py-2 text-sm">
                  <div className="mb-1 text-ink-500 dark:text-ink-400">Balances</div>
                  <ul className="space-y-1 text-mono-sm">
                    <li>XLM (native): {lookupInfo.balances.native}</li>
                    {lookupInfo.balances.assets.map((a) => (
                      <li key={a.code + a.issuer}>
                        {a.code}: {a.balance}{" "}
                        {a.limit && <span className="text-ink-500">(limit {a.limit})</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {lookupInfo.error && (
                <DataRow label="Error" value={<span className="text-red-600 dark:text-red-400">{lookupInfo.error}</span>} />
              )}
              {lookupDiag && lookupDiag.reserve && (
                <DataRow
                  label="Reserve (min balance)"
                  value={
                    <span title={lookupDiag.reserve.explanation}>
                      {lookupDiag.reserve.minimumBalanceXlm} XLM
                    </span>
                  }
                />
              )}
              {lookupDiag?.state === "invalid" && (
                <DataRow
                  label="Diagnostic"
                  value={<span className="text-red-600 dark:text-red-400">Invalid public key — cannot diagnose.</span>}
                />
              )}
              {lookupDiag?.state === "unavailable" && (
                <DataRow
                  label="Diagnostic"
                  value={<span className="text-amber-600 dark:text-amber-400">Account diagnostics unavailable (network error).</span>}
                />
              )}
              <div className="flex flex-wrap gap-2 pt-2">
                {expertUrl && (
                  <a
                    href={expertUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md border border-ink-300 px-3 py-1.5 text-sm dark:border-ink-700"
                  >
                    Open Stellar Expert ↗
                  </a>
                )}
                {friendbot && lookupInfo.status === "unfunded" && (
                  <a
                    href={friendbot}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md border border-stellar-400 bg-stellar-50 px-3 py-1.5 text-sm text-stellar-700 dark:bg-stellar-950/40 dark:text-stellar-300 dark:border-stellar-800"
                  >
                    Fund with Friendbot ↗
                  </a>
                )}
              </div>
            </dl>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-base font-semibold tracking-tight">Transaction lookup</h2>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-300">
          Paste a transaction hash to build a Stellar Expert link. Invalid hashes are
          rejected locally — no explorer URL is hardcoded.
        </p>
        <Input
          className="mt-3"
          placeholder="Transaction hash (64-char hex)"
          value={txHashInput}
          onChange={(e) => setTxHashInput(e.target.value)}
          aria-label="Transaction hash"
        />
        {txHashInput.trim() && !txParse && (
          <p className="mt-2 text-sm text-red-600">Enter a valid 64-character hex transaction hash.</p>
        )}
        {txParse && txParse.ok && (
          <a
            href={buildTransactionLink(txParse.value.hash, DEFAULT_NETWORK)}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block rounded-md border border-ink-300 px-3 py-1.5 text-sm dark:border-ink-700"
          >
            Open transaction on Stellar Expert ↗
          </a>
        )}
      </Card>
    </PageShell>
  );
}
