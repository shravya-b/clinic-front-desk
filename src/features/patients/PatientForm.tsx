import { useState, type FormEvent } from 'react';
import { Field, Select, TextInput, Textarea } from '../../components/ui/Form';
import { todayISO } from '../../lib/date';
import { hasErrors, validatePatient, type FieldErrors } from '../../lib/validation';
import type { Gender, PatientInput } from '../../types/domain';

export const EMPTY_PATIENT: PatientInput = {
  name: '',
  phone: '',
  gender: 'female',
  dateOfBirth: null,
  email: '',
  address: '',
  allergies: '',
};

interface PatientFormProps {
  /** Lets an external submit button target this form via `form={id}`. */
  id: string;
  initialValues?: PatientInput;
  disabled?: boolean;
  onSubmit: (values: PatientInput) => void;
}

/** Controlled patient details form. Validates on submit, then re-validates as the user fixes fields. */
export function PatientForm({ id, initialValues = EMPTY_PATIENT, disabled = false, onSubmit }: PatientFormProps) {
  const [values, setValues] = useState<PatientInput>(initialValues);
  const [errors, setErrors] = useState<FieldErrors<PatientInput>>({});
  const [submitted, setSubmitted] = useState(false);

  const update = <K extends keyof PatientInput>(key: K, value: PatientInput[K]) => {
    const next = { ...values, [key]: value };
    setValues(next);
    if (submitted) setErrors(validatePatient(next));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validatePatient(values);
    setSubmitted(true);
    setErrors(nextErrors);
    if (!hasErrors(nextErrors)) onSubmit(values);
  };

  return (
    <form id={id} onSubmit={handleSubmit} noValidate>
      <fieldset className="form-grid" disabled={disabled} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
        <Field label="Full name" error={errors.name} required className="span-2">
          {(control) => (
            <TextInput
              {...control}
              value={values.name}
              onChange={(event) => update('name', event.target.value)}
              autoComplete="off"
              autoFocus
            />
          )}
        </Field>

        <Field label="Phone" error={errors.phone} required>
          {(control) => (
            <TextInput
              {...control}
              type="tel"
              inputMode="tel"
              value={values.phone}
              onChange={(event) => update('phone', event.target.value)}
              placeholder="10-digit mobile number"
            />
          )}
        </Field>

        <Field label="Gender" required>
          {(control) => (
            <Select {...control} value={values.gender} onChange={(event) => update('gender', event.target.value as Gender)}>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </Select>
          )}
        </Field>

        <Field label="Date of birth" error={errors.dateOfBirth}>
          {(control) => (
            <TextInput
              {...control}
              type="date"
              max={todayISO()}
              value={values.dateOfBirth ?? ''}
              onChange={(event) => update('dateOfBirth', event.target.value || null)}
            />
          )}
        </Field>

        <Field label="Email" error={errors.email}>
          {(control) => (
            <TextInput
              {...control}
              type="email"
              value={values.email}
              onChange={(event) => update('email', event.target.value)}
              placeholder="Optional"
            />
          )}
        </Field>

        <Field label="Address" className="span-2">
          {(control) => (
            <TextInput
              {...control}
              value={values.address}
              onChange={(event) => update('address', event.target.value)}
              placeholder="Optional"
            />
          )}
        </Field>

        <Field label="Allergies" hint="Shown to doctors on every visit." className="span-2">
          {(control) => (
            <Textarea
              {...control}
              rows={2}
              value={values.allergies}
              onChange={(event) => update('allergies', event.target.value)}
              placeholder="e.g. Penicillin"
            />
          )}
        </Field>
      </fieldset>
    </form>
  );
}
