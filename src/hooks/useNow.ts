import { useEffect, useState } from 'react';
import { LIVE_REFRESH_MS } from '../config';

/** Current time, updated every `intervalMs`. Used for the live wait estimates. */
export function useNow(intervalMs: number = LIVE_REFRESH_MS): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}
