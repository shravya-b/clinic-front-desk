import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/ui/States';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { cx } from '../../lib/cx';
import { compareByArrival, compareBySlot, estimateQueue } from '../../lib/queue';
import type { AppointmentDetails, AppointmentStatus, Doctor, ID } from '../../types/domain';
import { AppointmentCard } from './AppointmentCard';
import { STATUS_META } from './StatusBadge';
import type { AppointmentActionHandler } from './useAppointmentActions';
import './appointments.css';

type BoardColumn = Exclude<AppointmentStatus, 'cancelled'>;

const COLUMNS: Array<{ status: BoardColumn; empty: string }> = [
  { status: 'scheduled', empty: 'No upcoming bookings' },
  { status: 'waiting', empty: 'Nobody is waiting' },
  { status: 'in_consultation', empty: 'No consultations in progress' },
  { status: 'completed', empty: 'No completed visits yet' },
];

const byCompletion = (a: AppointmentDetails, b: AppointmentDetails) =>
  (b.completedAt ?? '').localeCompare(a.completedAt ?? '');

interface QueueBoardProps {
  appointments: AppointmentDetails[];
  doctors: Doctor[];
  now: Date;
  showDoctor: boolean;
  pendingId: ID | null;
  onAction: AppointmentActionHandler;
}

/** Status columns for one day. On phones a tab selector shows one column at a time. */
export function QueueBoard({ appointments, doctors, now, showDoctor, pendingId, onAction }: QueueBoardProps) {
  const [mobileColumn, setMobileColumn] = useState<BoardColumn>('waiting');

  const estimates = useMemo(() => estimateQueue(appointments, doctors, now), [appointments, doctors, now]);

  const busyDoctorIds = useMemo(
    () => new Set(appointments.filter((a) => a.status === 'in_consultation').map((a) => a.doctorId)),
    [appointments],
  );

  const grouped = useMemo(() => {
    const pick = (status: AppointmentStatus) => appointments.filter((a) => a.status === status);
    return {
      scheduled: pick('scheduled').sort(compareBySlot),
      waiting: pick('waiting').sort(compareByArrival),
      in_consultation: pick('in_consultation'),
      completed: pick('completed').sort(byCompletion),
      cancelled: pick('cancelled'),
    };
  }, [appointments]);

  return (
    <div className="board-wrap">
      <SegmentedControl
        className="board-tabs"
        label="Queue status"
        value={mobileColumn}
        onChange={setMobileColumn}
        options={COLUMNS.map(({ status }) => ({
          value: status,
          label: STATUS_META[status].label,
          count: grouped[status].length,
        }))}
      />

      <div className="board">
        {COLUMNS.map(({ status, empty }) => (
          <section
            key={status}
            className={cx('board__column', `board__column--${status}`, status === mobileColumn && 'is-active')}
            aria-label={STATUS_META[status].label}
          >
            <header className="board__column-header">
              <h2>{STATUS_META[status].label}</h2>
              <span className="board__count">{grouped[status].length}</span>
            </header>
            <div className="board__cards">
              {grouped[status].length === 0 ? (
                <EmptyState compact title={empty} />
              ) : (
                grouped[status].map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    now={now}
                    estimate={estimates.get(appointment.id)}
                    showDoctor={showDoctor}
                    isPending={pendingId === appointment.id}
                    isDoctorBusy={busyDoctorIds.has(appointment.doctorId)}
                    onAction={onAction}
                  />
                ))
              )}
            </div>
          </section>
        ))}
      </div>

      {grouped.cancelled.length > 0 && (
        <details className="board__cancelled">
          <summary>Cancelled ({grouped.cancelled.length})</summary>
          <div className="board__cancelled-list">
            {grouped.cancelled.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                now={now}
                showDoctor={showDoctor}
                onAction={onAction}
              />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
