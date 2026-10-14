import { Badge, type Tone } from '../../components/ui/Badge';
import type { AppointmentStatus } from '../../types/domain';

export const STATUS_META: Record<AppointmentStatus, { label: string; tone: Tone }> = {
  scheduled: { label: 'Scheduled', tone: 'neutral' },
  waiting: { label: 'Waiting', tone: 'warning' },
  in_consultation: { label: 'In consultation', tone: 'info' },
  completed: { label: 'Completed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const { label, tone } = STATUS_META[status];
  return (
    <Badge tone={tone} dot>
      {label}
    </Badge>
  );
}
