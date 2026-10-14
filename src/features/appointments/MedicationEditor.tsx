import { Button, IconButton } from '../../components/ui/Button';
import { TextInput } from '../../components/ui/Form';
import type { Medication } from '../../types/domain';
import './appointments.css';

export const EMPTY_MEDICATION: Medication = { name: '', dosage: '', frequency: '', duration: '' };

const FIELDS: Array<{ key: keyof Medication; label: string; placeholder: string }> = [
  { key: 'name', label: 'Medicine', placeholder: 'Paracetamol 500 mg' },
  { key: 'dosage', label: 'Dosage', placeholder: '1 tablet' },
  { key: 'frequency', label: 'Frequency', placeholder: 'Twice a day' },
  { key: 'duration', label: 'Duration', placeholder: '5 days' },
];

interface MedicationEditorProps {
  value: Medication[];
  onChange: (medications: Medication[]) => void;
}

/** Editable list of prescribed medicines. */
export function MedicationEditor({ value, onChange }: MedicationEditorProps) {
  const updateRow = (index: number, key: keyof Medication, text: string) =>
    onChange(value.map((row, i) => (i === index ? { ...row, [key]: text } : row)));

  return (
    <div className="med-editor">
      {value.length > 0 && (
        <ol className="med-editor__rows">
          {value.map((medication, index) => (
            <li key={index} className="med-editor__row">
              {FIELDS.map((field) => (
                <TextInput
                  key={field.key}
                  aria-label={`${field.label} ${index + 1}`}
                  placeholder={field.placeholder}
                  value={medication[field.key]}
                  onChange={(event) => updateRow(index, field.key, event.target.value)}
                />
              ))}
              <IconButton
                icon="trash"
                label={`Remove medicine ${index + 1}`}
                onClick={() => onChange(value.filter((_, i) => i !== index))}
              />
            </li>
          ))}
        </ol>
      )}
      <Button size="sm" icon="plus" onClick={() => onChange([...value, EMPTY_MEDICATION])}>
        Add medicine
      </Button>
    </div>
  );
}
