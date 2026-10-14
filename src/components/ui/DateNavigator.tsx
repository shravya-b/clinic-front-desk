import { addDays, isISODate, todayISO } from '../../lib/date';
import { formatRelativeDay } from '../../lib/format';
import type { ISODate } from '../../types/domain';
import { Button, IconButton } from './Button';
import './DateNavigator.css';

interface DateNavigatorProps {
  value: ISODate;
  onChange: (date: ISODate) => void;
}

/** Previous / next day stepper with a date picker and a "Today" shortcut. */
export function DateNavigator({ value, onChange }: DateNavigatorProps) {
  const isToday = value === todayISO();

  return (
    <div className="date-nav">
      <div className="date-nav__stepper">
        <IconButton icon="chevron-left" label="Previous day" variant="secondary" onClick={() => onChange(addDays(value, -1))} />
        <label className="date-nav__picker">
          <span className="date-nav__label">{formatRelativeDay(value)}</span>
          <input
            type="date"
            className="date-nav__input"
            value={value}
            aria-label="Choose date"
            onChange={(event) => {
              if (isISODate(event.target.value)) onChange(event.target.value);
            }}
          />
        </label>
        <IconButton icon="chevron-right" label="Next day" variant="secondary" onClick={() => onChange(addDays(value, 1))} />
      </div>
      {!isToday && (
        <Button size="md" variant="ghost" onClick={() => onChange(todayISO())}>
          Today
        </Button>
      )}
    </div>
  );
}
