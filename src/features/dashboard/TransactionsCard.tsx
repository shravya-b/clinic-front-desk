import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { EmptyState } from '../../components/ui/States';
import { formatCurrency, formatPaymentMethod, formatShortDate, formatTime } from '../../lib/format';
import type { Transaction } from '../../services/dashboardService';
import type { ISODate } from '../../types/domain';
import { CollectionsBreakdown } from '../billing/CollectionsBreakdown';
import './dashboard.css';

interface TransactionsCardProps {
  transactions: Transaction[];
  date: ISODate;
}

export function TransactionsCard({ transactions, date }: TransactionsCardProps) {
  const total = transactions.reduce((sum, t) => sum + t.amount, 0);

  const columns: Column<Transaction>[] = [
    { key: 'time', header: 'Time', render: (t) => <span className="tabular nowrap">{formatTime(t.paidAt)}</span> },
    {
      key: 'patient',
      header: 'Patient',
      render: (t) => (
        <div className="cell-stack">
          <span className="cell-strong">{t.appointment.patient.name}</span>
          <span className="text-subtle">
            {t.appointment.doctor.name}
            {/* Payments can settle an older visit's balance. */}
            {t.appointment.date !== date && ` · visit ${formatShortDate(t.appointment.date)}`}
          </span>
        </div>
      ),
    },
    {
      key: 'method',
      header: 'Method',
      hideOnMobile: true,
      render: (t) => <Badge>{formatPaymentMethod(t.method)}</Badge>,
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (t) => <span className="tabular cell-strong">{formatCurrency(t.amount)}</span>,
    },
  ];

  return (
    <Card title="Transactions" subtitle={`${transactions.length} payment${transactions.length === 1 ? '' : 's'} received`} flush>
      {transactions.length === 0 ? (
        <EmptyState compact icon="wallet" title="No payments received" description="Payments recorded on this date will appear here." />
      ) : (
        <>
          <CollectionsBreakdown payments={transactions} />
          <DataTable
            caption="Payments received"
            columns={columns}
            rows={transactions}
            getRowKey={(t) => t.id}
            footer={
              <tr>
                <td colSpan={2}>Total collected</td>
                <td className="hide-mobile" />
                <td className="is-right tabular">{formatCurrency(total)}</td>
              </tr>
            }
          />
        </>
      )}
    </Card>
  );
}
