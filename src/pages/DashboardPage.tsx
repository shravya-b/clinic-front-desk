import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { DateNavigator } from '../components/ui/DateNavigator';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard, StatCardSkeleton } from '../components/ui/StatCard';
import { ErrorState, LoadingState, StaleDataNotice } from '../components/ui/States';
import { BookAppointmentModal } from '../features/appointments/BookAppointmentModal';
import { useAppointmentActions } from '../features/appointments/useAppointmentActions';
import { DoctorActivityCard } from '../features/dashboard/DoctorActivityCard';
import { FollowUpsCard } from '../features/dashboard/FollowUpsCard';
import { PendingPaymentsCard } from '../features/dashboard/PendingPaymentsCard';
import { TransactionsCard } from '../features/dashboard/TransactionsCard';
import { useDateParam } from '../hooks/useDateParam';
import { useNow } from '../hooks/useNow';
import { useQuery } from '../hooks/useQuery';
import { todayISO } from '../lib/date';
import { formatCurrency, formatRelativeDay, formatShortDate } from '../lib/format';
import { dashboardService, type DashboardStats } from '../services/dashboardService';
import type { AppointmentDetails } from '../types/domain';
import './pages.css';

function greeting(now: Date): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function StatsGrid({ stats, isToday }: { stats: DashboardStats; isToday: boolean }) {
  return (
    <div className="stats-grid">
      <StatCard
        icon="calendar"
        tone="primary"
        label="Appointments"
        value={stats.booked}
        hint={`${stats.completed} completed${stats.cancelled ? ` · ${stats.cancelled} cancelled` : ''}`}
      />
      <StatCard
        icon="clock"
        tone="warning"
        label={isToday ? 'Waiting now' : 'Waiting'}
        value={stats.waiting}
        hint={`${stats.inConsultation} in consultation`}
      />
      <StatCard icon="wallet" tone="success" label="Collected" value={formatCurrency(stats.collected)} hint="Payments received" />
      <StatCard
        icon="alert"
        tone="danger"
        label="Pending"
        value={formatCurrency(stats.outstanding)}
        hint="Unpaid from this date’s visits"
      />
    </div>
  );
}

export function DashboardPage() {
  const [date, setDate] = useDateParam();
  const now = useNow();
  const isToday = date === todayISO();
  const summary = useQuery(`dashboard:${date}`, () => dashboardService.getSummary(date));
  const { handleAction, dialogs } = useAppointmentActions();
  const [booking, setBooking] = useState<{ from?: AppointmentDetails } | null>(null);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`${greeting(now)}. Here’s the clinic for ${formatRelativeDay(date).toLowerCase()}.`}
        actions={
          <>
            <DateNavigator value={date} onChange={setDate} />
            <Button variant="primary" icon="plus" onClick={() => setBooking({})}>
              New appointment
            </Button>
          </>
        }
      />

      {summary.data ? (
        <div className="stack">
          <StaleDataNotice error={summary.error} onRetry={summary.reload} />
          <StatsGrid stats={summary.data.stats} isToday={isToday} />
          <div className="dashboard-grid">
            <div className="stack">
              <DoctorActivityCard activity={summary.data.doctors} date={date} isToday={isToday} now={now} />
              <TransactionsCard transactions={summary.data.transactions} date={date} />
            </div>
            <div className="stack">
              <PendingPaymentsCard
                forDate={summary.data.pendingForDate}
                allDates={summary.data.pendingAllDates}
                dateLabel={isToday ? 'Today' : formatShortDate(date)}
                onAction={handleAction}
              />
              <FollowUpsCard followUps={summary.data.followUps} onBook={(from) => setBooking({ from })} />
            </div>
          </div>
        </div>
      ) : summary.error ? (
        <ErrorState error={summary.error} title="Couldn’t load the dashboard" onRetry={summary.reload} />
      ) : (
        <div className="stack">
          <div className="stats-grid">
            {Array.from({ length: 4 }, (_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
          <LoadingState label="Loading dashboard…" />
        </div>
      )}

      {booking && (
        <BookAppointmentModal
          initialPatient={booking.from?.patient}
          initialDoctorId={booking.from?.doctorId}
          initialDate={date}
          onClose={() => setBooking(null)}
        />
      )}
      {dialogs}
    </>
  );
}
