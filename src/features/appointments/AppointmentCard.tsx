import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { cx } from '../../lib/cx';
import { hasOutstandingBalance } from '../../lib/billing';
import { minutesSince, todayISO } from '../../lib/date';
import { formatMinutes, formatPatientMeta, formatShortDate, formatSlot, formatTime } from '../../lib/format';
import type { QueueEstimate } from '../../lib/queue';
import type { AppointmentDetails } from '../../types/domain';
import { PaymentBadge } from '../billing/PaymentBadge';
import type { AppointmentActionHandler } from './useAppointmentActions';
import './appointments.css';

interface AppointmentCardProps {
  appointment: AppointmentDetails;
  now: Date;
  estimate?: QueueEstimate;
  showDoctor?: boolean;
  /** An action for this appointment is in flight. */
  isPending?: boolean;
  /** The doctor is with another patient, so this one can't be called in yet. */
  isDoctorBusy?: boolean;
  onAction: AppointmentActionHandler;
}

function StatusLine({ appointment, now, estimate }: Pick<AppointmentCardProps, 'appointment' | 'now' | 'estimate'>) {
  switch (appointment.status) {
    case 'scheduled':
      return (
        <span>
          <Icon name="clock" /> {appointment.time ? `Slot ${formatSlot(appointment.time)}` : 'Walk-in'}
        </span>
      );
    case 'waiting': {
      const waited = appointment.checkedInAt ? minutesSince(appointment.checkedInAt, now) : 0;
      return (
        <>
          <span className="queue-card__eta">
            <Icon name="clock" />
            {estimate && estimate.waitMinutes === 0 ? 'Next up' : estimate ? `~${formatMinutes(estimate.waitMinutes)} wait` : 'Waiting'}
            {estimate && <span className="text-subtle"> · #{estimate.position} in line</span>}
          </span>
          <span className="text-subtle">Arrived {formatMinutes(waited)} ago</span>
        </>
      );
    }
    case 'in_consultation':
      return (
        <span>
          <Icon name="activity" /> Started {appointment.startedAt && formatTime(appointment.startedAt)}
          {appointment.startedAt && (
            <span className="text-subtle"> · {formatMinutes(minutesSince(appointment.startedAt, now))}</span>
          )}
        </span>
      );
    case 'completed':
      return (
        <>
          <PaymentBadge appointment={appointment} showBalance />
          {appointment.followUpDate && (
            <span className="text-subtle">Follow-up {formatShortDate(appointment.followUpDate)}</span>
          )}
        </>
      );
    case 'cancelled':
      return <span className="text-subtle">Cancelled</span>;
  }
}

export function AppointmentCard({
  appointment,
  now,
  estimate,
  showDoctor = false,
  isPending = false,
  isDoctorBusy = false,
  onAction,
}: AppointmentCardProps) {
  const { patient, status } = appointment;
  const canCheckIn = status === 'scheduled' && appointment.date === todayISO();

  return (
    <article className={cx('queue-card', `queue-card--${status}`)} aria-busy={isPending || undefined}>
      <div className="queue-card__top">
        <span className="queue-card__token" aria-label={`Token ${appointment.token}`}>
          #{appointment.token}
        </span>
        <div className="queue-card__who">
          <button type="button" className="queue-card__name" onClick={() => onAction('view', appointment)}>
            {patient.name}
          </button>
          <p className="text-subtle">
            {formatPatientMeta(patient)}
            {showDoctor && ` · ${appointment.doctor.name}`}
          </p>
        </div>
      </div>

      {appointment.reason && <p className="queue-card__reason">{appointment.reason}</p>}

      <div className="queue-card__status">
        <StatusLine appointment={appointment} now={now} estimate={estimate} />
      </div>

      {status !== 'cancelled' && (
        <div className="queue-card__actions">
          {canCheckIn && (
            <Button size="sm" variant="primary" icon="log-in" disabled={isPending} onClick={() => onAction('check_in', appointment)}>
              Check in
            </Button>
          )}
          {status === 'waiting' && (
            <Button
              size="sm"
              variant={isDoctorBusy ? 'secondary' : 'primary'}
              icon="play"
              disabled={isPending || isDoctorBusy}
              title={isDoctorBusy ? `${appointment.doctor.name} is with another patient` : undefined}
              onClick={() => onAction('start', appointment)}
            >
              {isDoctorBusy ? 'Doctor busy' : 'Start consultation'}
            </Button>
          )}
          {status === 'in_consultation' && (
            <Button size="sm" variant="primary" icon="check" disabled={isPending} onClick={() => onAction('complete', appointment)}>
              Complete
            </Button>
          )}
          {hasOutstandingBalance(appointment) && (
            <Button size="sm" icon="wallet" onClick={() => onAction('record_payment', appointment)}>
              Record payment
            </Button>
          )}
          {status === 'completed' && (
            <Button size="sm" variant="ghost" icon="file" onClick={() => onAction('view', appointment)}>
              Details
            </Button>
          )}
          {(status === 'scheduled' || status === 'waiting') && (
            <Button size="sm" variant="ghost" disabled={isPending} onClick={() => onAction('cancel', appointment)}>
              Cancel
            </Button>
          )}
        </div>
      )}
    </article>
  );
}
