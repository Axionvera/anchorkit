"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Returns `true` for `delayMs` after `watch` changes, then settles back to
 * `false`. Used to show a genuine "loading" validation UI state while a form
 * recomputes, instead of jumping straight to invalid/warning/ready/blocked.
 *
 * `watch` should be a value that only changes when the fields you want to
 * track change (e.g. a `useMemo`-derived object, or `JSON.stringify(draft)`)
 * — the hook does not deep-compare, it relies on referential/value equality
 * of `watch` itself.
 */
export function useDebouncedLoading(watch: unknown, delayMs = 250): boolean {
  const [loading, setLoading] = useState(false);
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), delayMs);
    return () => clearTimeout(timer);
  }, [watch, delayMs]);

  return loading;
}
