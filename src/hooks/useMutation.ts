import { useCallback, useEffect, useRef, useState } from 'react';

export type MutationOutcome<T> = { ok: true; data: T } | { ok: false; error: unknown };

export interface MutationResult<TArgs extends unknown[], T> {
  /** Never throws: resolves to an outcome so callers can branch without try/catch. */
  mutate: (...args: TArgs) => Promise<MutationOutcome<T>>;
  isPending: boolean;
  error: unknown;
  reset: () => void;
}

export function useMutation<TArgs extends unknown[], T>(
  mutationFn: (...args: TArgs) => Promise<T>,
): MutationResult<TArgs, T> {
  const [isPending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const fnRef = useRef(mutationFn);

  useEffect(() => {
    fnRef.current = mutationFn;
  });

  const mutate = useCallback(async (...args: TArgs): Promise<MutationOutcome<T>> => {
    setPending(true);
    setError(null);
    try {
      const data = await fnRef.current(...args);
      return { ok: true, data };
    } catch (err) {
      setError(err);
      return { ok: false, error: err };
    } finally {
      setPending(false);
    }
  }, []);

  const reset = useCallback(() => setError(null), []);

  return { mutate, isPending, error, reset };
}
