import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import './Card.css';

interface CardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Controls shown on the right of the header. */
  actions?: ReactNode;
  /** Remove body padding, e.g. for edge-to-edge tables and lists. */
  flush?: boolean;
  className?: string;
  children: ReactNode;
}

export function Card({ title, subtitle, actions, flush = false, className, children }: CardProps) {
  const hasHeader = title || actions;
  return (
    <section className={cx('card', className)}>
      {hasHeader && (
        <header className="card__header">
          <div className="card__heading">
            {title && <h2 className="card__title">{title}</h2>}
            {subtitle && <p className="card__subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="card__actions">{actions}</div>}
        </header>
      )}
      <div className={cx('card__body', flush && 'card__body--flush')}>{children}</div>
    </section>
  );
}
