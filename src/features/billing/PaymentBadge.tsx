import { Badge, type Tone } from '../../components/ui/Badge';
import { balanceDue, paymentStatus } from '../../lib/billing';
import { formatCurrency } from '../../lib/format';
import type { Appointment, PaymentStatus } from '../../types/domain';

const META: Record<PaymentStatus, { label: string; tone: Tone }> = {
  paid: { label: 'Paid', tone: 'success' },
  partial: { label: 'Partly paid', tone: 'warning' },
  unpaid: { label: 'Unpaid', tone: 'danger' },
};

interface PaymentBadgeProps {
  appointment: Pick<Appointment, 'fee' | 'payments'>;
  /** Append the amount still due, e.g. "Unpaid · ₹500". */
  showBalance?: boolean;
}

export function PaymentBadge({ appointment, showBalance = false }: PaymentBadgeProps) {
  const status = paymentStatus(appointment);
  const { label, tone } = META[status];
  return (
    <Badge tone={tone}>
      {label}
      {showBalance && status !== 'paid' && ` · ${formatCurrency(balanceDue(appointment))} due`}
    </Badge>
  );
}
