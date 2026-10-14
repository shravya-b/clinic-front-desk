import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { isISODate, todayISO } from '../lib/date';
import type { ISODate } from '../types/domain';

/** Selected date kept in the URL (`?date=YYYY-MM-DD`) so it survives refreshes and can be shared. */
export function useDateParam(): [ISODate, (date: ISODate) => void] {
  const [params, setParams] = useSearchParams();
  const raw = params.get('date');
  const date = isISODate(raw) ? raw : todayISO();

  const setDate = useCallback(
    (next: ISODate) => {
      setParams(
        (current) => {
          const updated = new URLSearchParams(current);
          if (next === todayISO()) updated.delete('date');
          else updated.set('date', next);
          return updated;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  return [date, setDate];
}
