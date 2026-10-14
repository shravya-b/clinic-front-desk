import type { Prescription } from '../../types/domain';
import './appointments.css';

export function PrescriptionView({ prescription }: { prescription: Prescription }) {
  return (
    <div className="rx">
      <p className="rx__diagnosis">
        <span className="text-subtle">Diagnosis</span>
        {prescription.diagnosis}
      </p>
      {prescription.medications.length > 0 && (
        <ol className="rx__meds">
          {prescription.medications.map((med, index) => (
            <li key={index}>
              <span className="rx__med-name">{med.name}</span>
              <span className="text-subtle">
                {[med.dosage, med.frequency, med.duration].filter(Boolean).join(' · ')}
              </span>
            </li>
          ))}
        </ol>
      )}
      {prescription.advice && (
        <p className="rx__advice">
          <span className="text-subtle">Advice</span>
          {prescription.advice}
        </p>
      )}
    </div>
  );
}
