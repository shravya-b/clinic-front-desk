import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { PAYMENT_METHODS } from '../../lib/billing';
import { formatPaymentMethod } from '../../lib/format';
import type { PaymentMethod } from '../../types/domain';

interface PaymentMethodPickerProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

export function PaymentMethodPicker({ value, onChange }: PaymentMethodPickerProps) {
  return (
    <SegmentedControl
      label="Payment method"
      value={value}
      onChange={onChange}
      options={PAYMENT_METHODS.map((method) => ({ value: method, label: formatPaymentMethod(method) }))}
    />
  );
}
