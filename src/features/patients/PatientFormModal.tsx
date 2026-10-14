import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { InlineError } from '../../components/ui/States';
import { useToast } from '../../components/ui/Toast';
import { useMutation } from '../../hooks/useMutation';
import { patientService } from '../../services/patientService';
import type { Patient, PatientInput } from '../../types/domain';
import { PatientForm } from './PatientForm';

interface PatientFormModalProps {
  /** Edit this patient; omit to register a new one. */
  patient?: Patient;
  onClose: () => void;
  onSaved?: (patient: Patient) => void;
}

const FORM_ID = 'patient-form';

/** Picks only editable fields (callers may pass a richer object, e.g. a PatientSummary). */
function toInput(patient: Patient): PatientInput {
  const { name, phone, gender, dateOfBirth, email, address, allergies } = patient;
  return { name, phone, gender, dateOfBirth, email, address, allergies };
}

export function PatientFormModal({ patient, onClose, onSaved }: PatientFormModalProps) {
  const toast = useToast();
  const isEdit = Boolean(patient);
  const { mutate, isPending, error } = useMutation((values: PatientInput) =>
    patient ? patientService.update(patient.id, values) : patientService.create(values),
  );

  const handleSubmit = async (values: PatientInput) => {
    const result = await mutate(values);
    if (!result.ok) return;
    toast.success(isEdit ? 'Patient details updated.' : `${result.data.name} has been registered.`);
    onSaved?.(result.data);
    onClose();
  };

  return (
    <Modal
      title={isEdit ? 'Edit patient' : 'Register patient'}
      description={isEdit ? undefined : 'Add a new patient to the clinic records.'}
      onClose={onClose}
      dismissible={!isPending}
      footer={
        <>
          <Button onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form={FORM_ID} loading={isPending}>
            {isEdit ? 'Save changes' : 'Register patient'}
          </Button>
        </>
      }
    >
      <div className="stack">
        <PatientForm
          id={FORM_ID}
          initialValues={patient ? toInput(patient) : undefined}
          disabled={isPending}
          onSubmit={handleSubmit}
        />
        <InlineError error={error} />
      </div>
    </Modal>
  );
}
