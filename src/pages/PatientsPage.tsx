import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AsyncContent } from '../components/ui/AsyncContent';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SearchInput, Select } from '../components/ui/Form';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/States';
import { PatientDetails } from '../features/patients/PatientDetails';
import { PatientFormModal } from '../features/patients/PatientFormModal';
import { PatientList } from '../features/patients/PatientList';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useQuery } from '../hooks/useQuery';
import { cx } from '../lib/cx';
import { patientService, type PatientSort } from '../services/patientService';
import './pages.css';

const SORT_OPTIONS: Array<{ value: PatientSort; label: string }> = [
  { value: 'name', label: 'Name' },
  { value: 'recent', label: 'Recent visit' },
  { value: 'balance', label: 'Balance due' },
];

export function PatientsPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<PatientSort>('name');
  const [isRegistering, setIsRegistering] = useState(false);
  const term = useDebouncedValue(search.trim());
  const patients = useQuery(`patients:${term}:${sort}`, () => patientService.list({ search: term, sort }));

  return (
    <>
      <PageHeader
        title="Patients"
        description="Find a patient, view their history, or register someone new."
        actions={
          <Button variant="primary" icon="user-plus" onClick={() => setIsRegistering(true)}>
            Register patient
          </Button>
        }
      />

      <div className={cx('patients-layout', patientId && 'has-selection')}>
        <Card className="patients-layout__list" flush>
          <div className="list-search">
            <SearchInput
              label="Search patients"
              placeholder="Search by name or phone…"
              value={search}
              onChange={setSearch}
            />
          </div>
          <AsyncContent
            query={patients}
            loadingLabel="Loading patients…"
            errorTitle="Couldn’t load patients"
            isEmpty={(list) => list.length === 0}
            empty={
              term ? (
                <EmptyState
                  icon="search"
                  title={`No patients match “${term}”`}
                  description="Check the spelling or phone number, or register them as a new patient."
                  action={
                    <Button icon="user-plus" onClick={() => setIsRegistering(true)}>
                      Register patient
                    </Button>
                  }
                />
              ) : (
                <EmptyState icon="users" title="No patients yet" description="Registered patients will appear here." />
              )
            }
          >
            {(list) => (
              <>
                <div className="list-toolbar">
                  <p className="text-subtle" aria-live="polite">
                    {list.length} patient{list.length === 1 ? '' : 's'}
                  </p>
                  <label className="list-sort">
                    <span className="text-subtle">Sort by</span>
                    <Select value={sort} onChange={(event) => setSort(event.target.value as PatientSort)}>
                      {SORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </label>
                </div>
                <PatientList patients={list} selectedId={patientId} />
              </>
            )}
          </AsyncContent>
        </Card>

        <div className="patients-layout__detail">
          {patientId ? (
            <PatientDetails key={patientId} patientId={patientId} />
          ) : (
            <Card>
              <EmptyState
                icon="users"
                title="Select a patient"
                description="Choose a patient from the list to see their details, visit history and pending payments."
              />
            </Card>
          )}
        </div>
      </div>

      {isRegistering && (
        <PatientFormModal
          onClose={() => setIsRegistering(false)}
          onSaved={(patient) => navigate(`/patients/${patient.id}`)}
        />
      )}
    </>
  );
}
