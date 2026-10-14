import { Link } from 'react-router-dom';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/States';
import { todayISO } from '../../lib/date';
import { formatShortDate } from '../../lib/format';
import type { FollowUp } from '../../services/dashboardService';
import type { AppointmentDetails } from '../../types/domain';
import './dashboard.css';

interface FollowUpsCardProps {
  followUps: FollowUp[];
  onBook: (appointment: AppointmentDetails) => void;
}

export function FollowUpsCard({ followUps, onBook }: FollowUpsCardProps) {
  const today = todayISO();
  return (
    <Card title="Follow-ups due" subtitle="Patients asked to come back on this date" flush>
      {followUps.length === 0 ? (
        <EmptyState compact icon="repeat" title="No follow-ups due" />
      ) : (
        <ul className="follow-up-list">
          {followUps.map(({ appointment, isBooked }) => (
            <li key={appointment.id} className="follow-up">
              <Avatar name={appointment.patient.name} size="sm" />
              <div className="follow-up__main">
                <Link to={`/patients/${appointment.patientId}`} className="cell-strong follow-up__name">
                  {appointment.patient.name}
                </Link>
                <span className="text-subtle">
                  {appointment.doctor.name} · seen {formatShortDate(appointment.date)}
                </span>
              </div>
              {isBooked ? (
                <Badge tone="success">Booked</Badge>
              ) : appointment.followUpDate && appointment.followUpDate >= today ? (
                <Button size="sm" icon="plus" onClick={() => onBook(appointment)}>
                  Book
                </Button>
              ) : (
                <Badge tone="warning">Missed</Badge>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
