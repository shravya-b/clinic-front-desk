import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { minutesSince } from '../../lib/date';
import { formatMinutes } from '../../lib/format';
import type { DoctorActivity } from '../../services/dashboardService';
import type { ISODate } from '../../types/domain';
import './dashboard.css';

interface DoctorActivityCardProps {
  activity: DoctorActivity[];
  date: ISODate;
  isToday: boolean;
  now: Date;
}

export function DoctorActivityCard({ activity, date, isToday, now }: DoctorActivityCardProps) {
  return (
    <Card
      title={isToday ? 'Live queue' : 'Doctors'}
      subtitle={isToday ? 'Who is with each doctor right now' : 'Visits per doctor'}
      actions={
        <Link to={isToday ? '/appointments' : `/appointments?date=${date}`} className="card-link">
          Open queue
        </Link>
      }
      flush
    >
      <ul className="doctor-list">
        {activity.map(({ doctor, current, waiting, completed }) => (
          <li key={doctor.id} className="doctor-list__item">
            <div className="doctor-list__who">
              <p className="doctor-list__name">{doctor.name}</p>
              <p className="text-subtle">{doctor.specialty}</p>
            </div>
            {isToday && (
              <div className="doctor-list__now">
                {current ? (
                  <>
                    <span className="live-dot" aria-hidden="true" />
                    <span>
                      <strong>{current.patient.name}</strong>
                      {current.startedAt && (
                        <span className="text-subtle"> · {formatMinutes(minutesSince(current.startedAt, now))}</span>
                      )}
                    </span>
                  </>
                ) : (
                  <span className="text-subtle">Available</span>
                )}
              </div>
            )}
            <dl className="doctor-list__counts">
              {isToday && (
                <div>
                  <dt>Waiting</dt>
                  <dd>{waiting}</dd>
                </div>
              )}
              <div>
                <dt>Seen</dt>
                <dd>{completed}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </Card>
  );
}
