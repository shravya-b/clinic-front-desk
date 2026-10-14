import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import type { Tone } from './Badge';
import { Icon, type IconName } from './Icon';
import './StatCard.css';

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: IconName;
  tone?: Tone;
}

export function StatCard({ label, value, hint, icon, tone = 'neutral' }: StatCardProps) {
  return (
    <div className="stat-card">
      <span className={cx('stat-card__icon', `stat-card__icon--${tone}`)}>
        <Icon name={icon} size={18} />
      </span>
      <div className="stat-card__content">
        <p className="stat-card__label">{label}</p>
        <p className="stat-card__value tabular">{value}</p>
        {hint && <p className="stat-card__hint">{hint}</p>}
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="stat-card stat-card--skeleton" aria-hidden="true">
      <span className="stat-card__icon skeleton" />
      <div className="stat-card__content">
        <span className="skeleton skeleton--line" style={{ width: '50%' }} />
        <span className="skeleton skeleton--title" style={{ width: '70%' }} />
      </div>
    </div>
  );
}
