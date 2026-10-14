import { useMemo, useState } from 'react';
import { Button } from '../components/ui/Button';
import { DateNavigator } from '../components/ui/DateNavigator';
import { PageHeader } from '../components/ui/PageHeader';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState, ErrorState, LoadingState, StaleDataNotice } from '../components/ui/States';
import { BookAppointmentModal } from '../features/appointments/BookAppointmentModal';
import { QueueBoard } from '../features/appointments/QueueBoard';
import { useAppointmentActions } from '../features/appointments/useAppointmentActions';
import { useDateParam } from '../hooks/useDateParam';
import { useDoctors } from '../hooks/useDoctors';
import { useNow } from '../hooks/useNow';
import { useQuery } from '../hooks/useQuery';
import { todayISO } from '../lib/date';
import { formatRelativeDay } from '../lib/format';
import { appointmentService } from '../services/appointmentService';
import type { Doctor, ID } from '../types/domain';
import './pages.css';

const ALL_DOCTORS = 'all';

/** "Dr. Ananya Rao" → "Dr. Rao" for compact filters. */
const shortName = (doctor: Doctor) => `Dr. ${doctor.name.split(' ').at(-1)}`;

export function AppointmentsPage() {
  const [date, setDate] = useDateParam();
  const [doctorFilter, setDoctorFilter] = useState<ID>(ALL_DOCTORS);
  const [isBooking, setIsBooking] = useState(false);
  const now = useNow();
  const doctors = useDoctors();
  const appointments = useQuery(`appointments:${date}`, () => appointmentService.list({ date }));
  const { handleAction, pendingId, dialogs } = useAppointmentActions();

  const today = todayISO();
  const isToday = date === today;
  const canBook = date >= today;

  const visible = useMemo(
    () =>
      doctorFilter === ALL_DOCTORS
        ? appointments.data
        : appointments.data?.filter((a) => a.doctorId === doctorFilter),
    [appointments.data, doctorFilter],
  );

  const renderBoard = () => {
    if (!visible || !doctors.data) {
      const error = appointments.error ?? doctors.error;
      return error ? (
        <ErrorState
          error={error}
          title="Couldn’t load appointments"
          onRetry={() => {
            appointments.reload();
            doctors.reload();
          }}
        />
      ) : (
        <LoadingState label="Loading queue…" />
      );
    }
    if (visible.length === 0) {
      return (
        <EmptyState
          icon="calendar"
          title={`No appointments ${isToday ? 'today' : 'on this date'}`}
          description={canBook ? 'Book a patient to start the queue.' : 'Nothing was booked for this date.'}
          action={
            canBook && (
              <Button variant="primary" icon="plus" onClick={() => setIsBooking(true)}>
                Book appointment
              </Button>
            )
          }
        />
      );
    }
    return (
      <div className="stack">
        <StaleDataNotice error={appointments.error} onRetry={appointments.reload} />
        <QueueBoard
          appointments={visible}
          doctors={doctors.data}
          now={now}
          showDoctor={doctorFilter === ALL_DOCTORS}
          pendingId={pendingId}
          onAction={handleAction}
        />
      </div>
    );
  };

  return (
    <>
      <PageHeader
        title="Appointments"
        description={
          <span className="row">
            {isToday ? 'Live queue for today. Wait times update automatically.' : `Appointments for ${formatRelativeDay(date)}.`}
            {appointments.isRefreshing && <Spinner size="sm" className="text-subtle" />}
          </span>
        }
        actions={
          <>
            <DateNavigator value={date} onChange={setDate} />
            {canBook && (
              <Button variant="primary" icon="plus" onClick={() => setIsBooking(true)}>
                Book appointment
              </Button>
            )}
          </>
        }
      />

      {doctors.data && (
        <div className="toolbar">
          <SegmentedControl
            label="Filter by doctor (counts show patients waiting)"
            value={doctorFilter}
            onChange={setDoctorFilter}
            options={[
              { value: ALL_DOCTORS, label: 'All doctors' },
              ...doctors.data.map((doctor) => ({
                value: doctor.id,
                label: shortName(doctor),
                count: appointments.data?.filter((a) => a.doctorId === doctor.id && a.status === 'waiting').length,
              })),
            ]}
          />
        </div>
      )}

      {renderBoard()}

      {isBooking && (
        <BookAppointmentModal
          initialDate={date}
          initialDoctorId={doctorFilter === ALL_DOCTORS ? null : doctorFilter}
          onClose={() => setIsBooking(false)}
        />
      )}
      {dialogs}
    </>
  );
}
