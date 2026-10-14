import type { ButtonHTMLAttributes } from 'react';
import { cx } from '../../lib/cx';
import { Icon, type IconName } from './Icon';
import { Spinner } from './Spinner';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  /** Shows a spinner and disables the button. */
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  loading = false,
  fullWidth = false,
  disabled,
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx('btn', `btn--${variant}`, `btn--${size}`, fullWidth && 'btn--full', className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner size="sm" /> : icon && <Icon name={icon} />}
      {children}
    </button>
  );
}

interface IconButtonProps extends Omit<ButtonProps, 'icon' | 'children'> {
  icon: IconName;
  /** Accessible name; also shown as a tooltip. */
  label: string;
}

export function IconButton({ icon, label, variant = 'ghost', className, ...rest }: IconButtonProps) {
  return (
    <Button
      variant={variant}
      icon={icon}
      aria-label={label}
      title={label}
      className={cx('btn--icon', className)}
      {...rest}
    />
  );
}
