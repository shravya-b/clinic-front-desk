import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import './Badge.css';

export type Tone = 'neutral' | 'info' | 'warning' | 'success' | 'danger' | 'primary';

interface BadgeProps {
  tone?: Tone;
  /** Leading status dot. */
  dot?: boolean;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = 'neutral', dot = false, children, className }: BadgeProps) {
  return (
    <span className={cx('badge', `badge--${tone}`, className)}>
      {dot && <span className="badge__dot" aria-hidden="true" />}
      {children}
    </span>
  );
}
