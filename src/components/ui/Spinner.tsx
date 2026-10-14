import { cx } from '../../lib/cx';
import './Spinner.css';

interface SpinnerProps {
  size?: 'sm' | 'md';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return <span className={cx('spinner', `spinner--${size}`, className)} aria-hidden="true" />;
}
