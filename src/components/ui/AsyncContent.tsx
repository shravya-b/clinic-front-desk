import type { ReactNode } from 'react';
import type { QueryResult } from '../../hooks/useQuery';
import { ErrorState, LoadingState, StaleDataNotice } from './States';

interface AsyncContentProps<T> {
  query: QueryResult<T>;
  loadingLabel?: string;
  errorTitle?: string;
  /** Rendered instead of `children` when `isEmpty(data)` is true. */
  empty?: ReactNode;
  isEmpty?: (data: T) => boolean;
  compact?: boolean;
  children: (data: T) => ReactNode;
}

/**
 * Renders the loading, error, empty or success state of a query in one consistent way.
 * If a refresh fails while data is already showing, the data stays and a notice says so.
 */
export function AsyncContent<T>({
  query,
  loadingLabel,
  errorTitle,
  empty,
  isEmpty,
  compact,
  children,
}: AsyncContentProps<T>) {
  if (query.data === undefined) {
    return query.error ? (
      <ErrorState error={query.error} title={errorTitle} onRetry={query.reload} compact={compact} />
    ) : (
      <LoadingState label={loadingLabel} compact={compact} />
    );
  }
  const content = empty !== undefined && isEmpty?.(query.data) ? empty : children(query.data);
  if (!query.error) return <>{content}</>;
  return (
    <>
      <div className="async-content__stale">
        <StaleDataNotice error={query.error} onRetry={query.reload} />
      </div>
      {content}
    </>
  );
}
