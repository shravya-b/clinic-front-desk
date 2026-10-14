import { useCallback, useEffect, useRef, useState } from 'react';
import { onDataChanged } from '../services/events';

export interface QueryResult<T> {
  data: T | undefined;
  error: unknown;
  /** True only while there is no data yet for the current key. */
  isLoading: boolean;
  /** True while refetching in the background with data already on screen. */
  isRefreshing: boolean;
  reload: () => void;
}

export interface QueryOptions {
  /** Refetch whenever any service writes data (default true). */
  refetchOnDataChange?: boolean;
  /** Skip fetching, e.g. until a required parameter is available. */
  enabled?: boolean;
}

interface QueryState<T> {
  key: string | null;
  data: T | undefined;
  error: unknown;
  pending: boolean;
}

/**
 * Minimal data-fetching hook. `key` identifies the request: when it changes
 * the query refetches, and stale data from a previous key is never shown.
 */
export function useQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  { refetchOnDataChange = true, enabled = true }: QueryOptions = {},
): QueryResult<T> {
  const [state, setState] = useState<QueryState<T>>({ key: null, data: undefined, error: null, pending: enabled });
  const fetcherRef = useRef(fetcher);
  const latestRequest = useRef(0);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const run = useCallback(() => {
    const requestId = ++latestRequest.current;
    setState((s) => ({ ...s, pending: true }));
    fetcherRef.current().then(
      (data) => {
        if (requestId === latestRequest.current) setState({ key, data, error: null, pending: false });
      },
      (error: unknown) => {
        if (requestId !== latestRequest.current) return;
        // Keep showing data for the same key; a failed background refresh shouldn't blank the screen.
        setState((s) => ({ key, data: s.key === key ? s.data : undefined, error, pending: false }));
      },
    );
  }, [key]);

  useEffect(() => {
    if (enabled) run();
  }, [enabled, run]);

  useEffect(() => {
    if (!enabled || !refetchOnDataChange) return;
    return onDataChanged(run);
  }, [enabled, refetchOnDataChange, run]);

  const isCurrent = state.key === key;
  const data = isCurrent ? state.data : undefined;
  const error = isCurrent ? state.error : null;
  return {
    data,
    error,
    isLoading: enabled && data === undefined && !error,
    isRefreshing: state.pending && data !== undefined,
    reload: run,
  };
}
