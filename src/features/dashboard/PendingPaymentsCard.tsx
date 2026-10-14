import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { EmptyState } from '../../components/ui/States';
import { balanceDue } from '../../lib/billing';
import { formatCurrency, formatShortDate } from '../../lib/format';
import type { AppointmentDetails } from '../../types/domain';
import type { AppointmentActionHandler } from '../appointments/useAppointmentActions';
import { PaymentBadge } from '../billing/PaymentBadge';
import './dashboard.css';

type Scope = 'date' | 'all';

interface PendingPaymentsCardProps {
  forDate: AppointmentDetails[];
  allDates: AppointmentDetails[];
  dateLabel: string;
  onAction: AppointmentActionHandler;
}

export function PendingPaymentsCard({ forDate, allDates, dateLabel, onAction }: PendingPaymentsCardProps) {
  const [scope, setScope] = useState<Scope>('date');
  const rows = scope === 'date' ? forDate : allDates;
  const total = rows.reduce((sum, a) => sum + balanceDue(a), 0);

  const columns: Column<AppointmentDetails>[] = [
    {
      key: 'patient',
      header: 'Patient',
      render: (a) => (
        <div className="cell-stack">
          <button type="button" className="cell-link" onClick={() => onAction('view', a)}>
            {a.patient.name}
          </button>
          <span className="text-subtle">
            {scope === 'all' && `${formatShortDate(a.date)} · `}
            {a.doctor.name}
          </span>
        </div>
      ),
    },
    { key: 'status', header: 'Status', hideOnMobile: true, render: (a) => <PaymentBadge appointment={a} /> },
    {
      key: 'due',
      header: 'Due',
      align: 'right',
      render: (a) => <span className="tabular cell-strong">{formatCurrency(balanceDue(a))}</span>,
    },
    {
      key: 'action',
      header: <span className="visually-hidden">Actions</span>,
      align: 'right',
      render: (a) => (
        <Button size="sm" onClick={() => onAction('record_payment', a)}>
          Collect
        </Button>
      ),
    },
  ];

  return (
    <Card
      title="Pending payments"
      subtitle={rows.length ? `${formatCurrency(total)} outstanding` : undefined}
      actions={
        <SegmentedControl
          size="sm"
          label="Pending payments scope"
          value={scope}
          onChange={setScope}
          options={[
            { value: 'date', label: dateLabel, count: forDate.length },
            { value: 'all', label: 'All dates', count: allDates.length },
          ]}
        />
      }
      flush
    >
      {rows.length === 0 ? (
        <EmptyState
          compact
          icon="check"
          title="Nothing pending"
          description={scope === 'date' ? 'All visits on this date are paid in full.' : 'Every visit is paid in full.'}
        />
      ) : (
        <DataTable caption="Pending payments" columns={columns} rows={rows} getRowKey={(a) => a.id} />
      )}
    </Card>
  );
}
