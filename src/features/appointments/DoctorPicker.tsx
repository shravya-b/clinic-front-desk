import { cx } from '../../lib/cx';
import { formatCurrency } from '../../lib/format';
import type { Doctor, ID } from '../../types/domain';
import './appointments.css';

interface DoctorPickerProps {
  doctors: Doctor[];
  value: ID | null;
  onChange: (doctorId: ID) => void;
  /** Optional per-doctor note, e.g. current queue length. */
  getNote?: (doctor: Doctor) => string | null;
  error?: string;
}

/** Radio cards instead of a dropdown: with 2-3 doctors it's quicker to see them all. */
export function DoctorPicker({ doctors, value, onChange, getNote, error }: DoctorPickerProps) {
  return (
    <fieldset className="doctor-picker" aria-invalid={error ? true : undefined}>
      <legend className="field__label">
        Doctor <span className="field__required" aria-hidden="true">*</span>
      </legend>
      <div className="doctor-picker__options">
        {doctors.map((doctor) => {
          const note = getNote?.(doctor);
          return (
            <label key={doctor.id} className={cx('doctor-option', value === doctor.id && 'is-selected')}>
              <input
                type="radio"
                name="doctor"
                value={doctor.id}
                checked={value === doctor.id}
                onChange={() => onChange(doctor.id)}
                className="visually-hidden"
              />
              <span className="doctor-option__name">{doctor.name}</span>
              <span className="text-subtle">
                {doctor.specialty} · {formatCurrency(doctor.consultationFee)}
              </span>
              {note && <span className="doctor-option__note">{note}</span>}
            </label>
          );
        })}
      </div>
      {error && <p className="field__message field__message--error">{error}</p>}
    </fieldset>
  );
}
