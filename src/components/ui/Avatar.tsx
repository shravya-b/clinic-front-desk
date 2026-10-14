import { cx } from '../../lib/cx';
import { initials } from '../../lib/format';
import './Avatar.css';

const PALETTE_SIZE = 6;

/** Stable colour per name so the same patient always looks the same. */
function paletteIndex(name: string): number {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return Math.abs(hash) % PALETTE_SIZE;
}

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ name, size = 'md' }: AvatarProps) {
  return (
    <span className={cx('avatar', `avatar--${size}`, `avatar--c${paletteIndex(name)}`)} aria-hidden="true">
      {initials(name)}
    </span>
  );
}
