/**
 * Account reserve and spendable balance model (issue #22).
 *
 * Stellar accounts cannot spend their entire balance: the protocol locks a
 * minimum balance proportional to the number of ledger entries the account
 * owns. This module derives that reserve and splits the native balance into
 * what is spendable and what is not — or reports `unknown` without inventing
 * a number when the underlying account data is unavailable.
 */

import type { AccountBalanceModel, AccountInfo } from "@anchorkit/types";
import { normalizeAmount } from "./payments";

/**
 * Stellar's base reserve, in XLM. The minimum balance is this value multiplied
 * by the number of ledger entries the account is charged for.
 */
export const STELLAR_BASE_RESERVE_XLM = 0.5;

/**
 * Ledger entries every account is charged for before any subentries, per the
 * protocol's `(2 + subentries)` rule.
 */
export const BASE_ENTRY_COUNT = 2;

export interface ReserveInfo {
  /** Base reserve charged per ledger entry, in XLM. */
  baseReserve: number;
  /** Number of subentries counted against the reserve. */
  subentryCount: number;
  /** Total ledger entries charged: the base entries plus the subentries. */
  entryCount: number;
  /** Computed minimum balance in XLM: `entryCount × baseReserve`. */
  minimumBalanceXlm: number;
  /** Human-readable explanation suitable for UI. */
  explanation: string;
}

/**
 * Reserve awareness derived from an account's subentry count.
 *
 * Stellar's rule is `(2 + subentries) × base reserve`, where the base reserve
 * is 0.5 XLM. The two base entries are part of the entry count — they are not
 * an additional flat charge on top of it.
 */
export function computeReserve(subentryCount: number | undefined): ReserveInfo {
  const subs = subentryCount ?? 0;
  const entryCount = BASE_ENTRY_COUNT + subs;
  const minimumBalanceXlm = entryCount * STELLAR_BASE_RESERVE_XLM;

  return {
    baseReserve: STELLAR_BASE_RESERVE_XLM,
    subentryCount: subs,
    entryCount,
    minimumBalanceXlm,
    explanation:
      `Minimum balance is ${minimumBalanceXlm} XLM: ` +
      `${entryCount} ledger entries (${BASE_ENTRY_COUNT} base + ${subs} subentries) ` +
      `× ${STELLAR_BASE_RESERVE_XLM} XLM base reserve.`,
  };
}

/**
 * A balance model that carries no amounts, only a reason.
 *
 * Use this whenever a spendable figure cannot be backed by real account data —
 * it is the only correct answer that does not overstate what a user can spend.
 */
export function unknownBalanceModel(explanation: string): AccountBalanceModel {
  return {
    state: "unknown",
    total: null,
    reserve: null,
    spendable: null,
    unavailable: null,
    explanation,
  };
}

/**
 * Splits an account's native balance into spendable and unavailable parts.
 *
 * Returns a `"known"` model only when the account's balance is actually
 * available. Anything else — a network failure, an errored lookup, or a funded
 * account whose balances did not come through — yields `"unknown"` with every
 * amount set to `null`, so callers cannot accidentally present a placeholder
 * as a real spendable figure.
 *
 * `spendable` is clamped at zero: an account below its minimum balance has
 * nothing to spend, not a negative amount.
 *
 * Note: `spendable` does not subtract selling liabilities, which Horizon
 * reports but `AccountBalances` does not carry. For an account with open
 * offers the real spendable amount is lower, so treat this as an upper bound.
 */
export function computeBalanceModel(info: AccountInfo): AccountBalanceModel {
  if (info.status === "unknown" || info.status === "error") {
    return unknownBalanceModel(
      "Account data is unavailable, so the spendable balance cannot be determined."
    );
  }

  if (info.status === "funded" && info.balances?.native === undefined) {
    return unknownBalanceModel(
      "Account balances were not returned, so the spendable balance cannot be determined."
    );
  }

  const isUnfunded = info.status === "unfunded";
  const totalXlm = isUnfunded ? 0 : Number(info.balances?.native);

  if (!Number.isFinite(totalXlm)) {
    return unknownBalanceModel(
      "Account balance could not be parsed, so the spendable balance cannot be determined."
    );
  }

  const reserve = computeReserve(isUnfunded ? 0 : info.subentryCount);
  const spendableXlm = Math.max(0, totalXlm - reserve.minimumBalanceXlm);
  const unavailableXlm = totalXlm - spendableXlm;

  const explanation = isUnfunded
    ? "Account is not funded yet. It needs at least " +
      `${reserve.minimumBalanceXlm} XLM to exist on the network.`
    : `${normalizeAmount(String(unavailableXlm))} XLM of the ${normalizeAmount(
        String(totalXlm)
      )} XLM balance is locked by the ${reserve.minimumBalanceXlm} XLM minimum ` +
      `balance and cannot be spent. Selling liabilities are not subtracted, so ` +
      `accounts with open offers can spend less than this.`;

  return {
    state: "known",
    total: normalizeAmount(String(totalXlm)),
    reserve: normalizeAmount(String(reserve.minimumBalanceXlm)),
    spendable: normalizeAmount(String(spendableXlm)),
    unavailable: normalizeAmount(String(unavailableXlm)),
    explanation,
  };
}
