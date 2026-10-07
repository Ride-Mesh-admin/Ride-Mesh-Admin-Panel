"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type CacheEntry = { data: unknown; fetchedAt: number };

const memoryCache = new Map<string, CacheEntry>();

function isTabVisible(): boolean {
  if (typeof document === "undefined") return true;
  return document.visibilityState === "visible";
}

export type UseAdminQueryOptions<T> = {
  /** Unique cache key */
  key: string;
  fetcher: () => Promise<T>;
  /** Poll interval while tab visible (ms). 0 = no poll. */
  refreshInterval?: number;
  /** Serve cached data newer than this without refetch (ms) */
  staleTime?: number;
  enabled?: boolean;
};

export function useAdminQuery<T>({
  key,
  fetcher,
  refreshInterval = 45_000,
  staleTime = 8_000,
  enabled = true,
}: UseAdminQueryOptions<T>) {
  const cached = memoryCache.get(key);
  const [data, setData] = useState<T | null>((cached?.data as T) ?? null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!cached);
  const [fetching, setFetching] = useState(false);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(
    async (opts?: { force?: boolean; background?: boolean }) => {
      if (!enabled) return;
      const hit = memoryCache.get(key);
      const fresh = hit && Date.now() - hit.fetchedAt < staleTime;
      if (!opts?.force && fresh) {
        setData(hit.data as T);
        setLoading(false);
        return;
      }
      if (!opts?.background) setLoading(!hit);
      setFetching(true);
      setError(null);
      try {
        const next = await fetcherRef.current();
        memoryCache.set(key, { data: next, fetchedAt: Date.now() });
        setData(next);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Request failed");
      } finally {
        setLoading(false);
        setFetching(false);
      }
    },
    [enabled, key, staleTime],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!enabled || !refreshInterval) return;

    let timer: number | undefined;

    function schedule() {
      window.clearInterval(timer);
      if (!isTabVisible()) return;
      timer = window.setInterval(() => {
        if (isTabVisible()) void load({ background: true });
      }, refreshInterval);
    }

    function onVisibility() {
      if (isTabVisible()) {
        void load({ background: true });
        schedule();
      } else {
        window.clearInterval(timer);
      }
    }

    schedule();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, load, refreshInterval]);

  const mutate = useCallback(
    (updater: T | ((prev: T | null) => T)) => {
      setData((prev) => {
        const next = typeof updater === "function" ? (updater as (p: T | null) => T)(prev) : updater;
        memoryCache.set(key, { data: next, fetchedAt: Date.now() });
        return next;
      });
    },
    [key],
  );

  const invalidate = useCallback(() => {
    memoryCache.delete(key);
    return load({ force: true });
  }, [key, load]);

  return { data, error, loading, fetching, reload: () => load({ force: true }), mutate, invalidate };
}

export function invalidateAdminQuery(keyPrefix: string): void {
  for (const key of memoryCache.keys()) {
    if (key === keyPrefix || key.startsWith(keyPrefix)) memoryCache.delete(key);
  }
}
