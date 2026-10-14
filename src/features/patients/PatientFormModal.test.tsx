import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDb } from '../../services/db';
import { patientService } from '../../services/patientService';
import { renderWithProviders } from '../../test/render';
import { PatientFormModal } from './PatientFormModal';

beforeEach(() => {
  resetDb();
});

describe('PatientFormModal', () => {
  it('flags invalid fields accessibly and clears errors as they are fixed', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PatientFormModal onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Register patient' }));

    const name = screen.getByLabelText(/full name/i);
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(name).toHaveAccessibleDescription('Name is required');
    expect(screen.getByLabelText(/phone/i)).toHaveAccessibleDescription('Phone number is required');

    await user.type(name, 'Asha Pillai');
    expect(name).not.toHaveAttribute('aria-invalid');
  });

  it('registers a patient and reports it back', async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    const onClose = vi.fn();
    renderWithProviders(<PatientFormModal onClose={onClose} onSaved={onSaved} />);

    await user.type(screen.getByLabelText(/full name/i), 'Asha Pillai');
    await user.type(screen.getByLabelText(/phone/i), '98123 00011');
    await user.click(screen.getByRole('button', { name: 'Register patient' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ name: 'Asha Pillai' })));
    expect(onClose).toHaveBeenCalled();
    expect(await patientService.list({ search: 'asha pil' })).toHaveLength(1);
  });

  it('shows the server error when the patient already exists', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PatientFormModal onClose={vi.fn()} />);

    await user.type(screen.getByLabelText(/full name/i), 'Priya Sharma');
    await user.type(screen.getByLabelText(/phone/i), '9876543210');
    await user.click(screen.getByRole('button', { name: 'Register patient' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/already registered/i);
  });
});
