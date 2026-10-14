import { useEffect, useRef, type ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { getErrorMessage } from '../../services/errors';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import { Spinner } from './Spinner';
import './States.css';

interface LoadingStateProps {
  label?: string;
  compact?: boolean;
}

export function LoadingState({ label = 'Loading…', compact = false }: LoadingStateProps) {
  return (
    <div className={cx('state', compact && 'state--compact')} role="status" aria-live="polite">
      <Spinner />
      <p className="state__description">{label}</p>
    </div>
  );
}

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}

export function EmptyState({ icon = 'inbox', title, description, action, compact = false }: EmptyStateProps) {
  return (
    <div className={cx('state', compact && 'state--compact')}>
      <span className="state__icon">
        <Icon name={icon} size={20} />
      </span>
      <p className="state__title">{title}</p>
      {description && <p className="state__description">{description}</p>}
      {action}
    </div>
  );
}

interface ErrorStateProps {
  error: unknown;
  title?: string;
  onRetry?: () => void;
  compact?: boolean;
}

export function ErrorState({ error, title = 'Couldn’t load this', onRetry, compact = false }: ErrorStateProps) {
  return (
    <div className={cx('state', 'state--error', compact && 'state--compact')} role="alert">
      <span className="state__icon">
        <Icon name="alert" size={20} />
      </span>
      <p className="state__title">{title}</p>
      <p className="state__description">{getErrorMessage(error)}</p>
      {onRetry && (
        <Button size="sm" icon="refresh" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/** Error banner for forms and dialogs. Scrolls into view because it's often below the fold on phones. */
export function InlineError({ error }: { error: unknown }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error) ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [error]);

  if (!error) return null;
  return (
    <div ref={ref} className="inline-error" role="alert">
      <Icon name="alert" />
      <span>{getErrorMessage(error)}</span>
    </div>
  );
}

interface StaleDataNoticeProps {
  /** The latest refresh error; nothing renders when it's empty. */
  error: unknown;
  onRetry: () => void;
}

/**
 * Shown when a background refresh fails but older data is still on screen, so
 * nobody acts on a queue or balance that may be out of date without knowing it.
 */
export function StaleDataNotice({ error, onRetry }: StaleDataNoticeProps) {
  if (!error) return null;
  return (
    <div className="stale-notice" role="status">
      <Icon name="alert" />
      <span className="stale-notice__text">Couldn’t refresh — showing the last loaded data.</span>
      <Button size="sm" variant="ghost" icon="refresh" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
