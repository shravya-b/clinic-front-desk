import { totalsByMethod } from '../../lib/billing';
import { formatCurrency, formatPaymentMethod } from '../../lib/format';
import type { Payment } from '../../types/domain';
import './billing.css';

interface CollectionsBreakdownProps {
  payments: Array<Pick<Payment, 'amount' | 'method'>>;
}

const percent = (part: number, total: number) => Math.round((part / total) * 100);

/**
 * How the day's payments split between cash, UPI and card (for checking the cash drawer).
 * The legend repeats every number, so the colours aren't the only way to read it.
 */
export function CollectionsBreakdown({ payments }: CollectionsBreakdownProps) {
  const totals = totalsByMethod(payments);
  const total = totals.reduce((sum, t) => sum + t.amount, 0);
  if (total === 0) return null;

  return (
    <figure className="breakdown">
      <figcaption className="breakdown__title">By payment method</figcaption>
      <div className="breakdown__bar" aria-hidden="true">
        {totals
          .filter((t) => t.amount > 0)
          .map((t) => (
            <span
              key={t.method}
              className={`breakdown__segment breakdown__segment--${t.method}`}
              style={{ flexGrow: t.amount }}
              data-tooltip={`${formatPaymentMethod(t.method)} · ${formatCurrency(t.amount)} (${percent(t.amount, total)}%)`}
            />
          ))}
      </div>
      <ul className="breakdown__legend">
        {totals.map((t) => (
          <li key={t.method}>
            <span className={`breakdown__swatch breakdown__segment--${t.method}`} aria-hidden="true" />
            <span className="breakdown__label">{formatPaymentMethod(t.method)}</span>
            <span className="breakdown__value tabular">{formatCurrency(t.amount)}</span>
            <span className="text-subtle tabular">
              {t.count} {t.count === 1 ? 'payment' : 'payments'}
              {t.amount > 0 && ` · ${percent(t.amount, total)}%`}
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
