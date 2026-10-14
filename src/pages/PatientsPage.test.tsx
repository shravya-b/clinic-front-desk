import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { resetDb } from '../services/db';
import { renderWithProviders } from '../test/render';
import { PatientsPage } from './PatientsPage';

beforeEach(() => {
  resetDb();
});

const patientNames = () =>
  within(screen.getByRole('list'))
    .getAllByRole('link')
    .map((link) => link.querySelector('.patient-row__name')?.textContent);

describe('PatientsPage', () => {
  it('searches by name and offers registration when nothing matches', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PatientsPage />, { route: '/patients' });
    expect(await screen.findByText('16 patients')).toBeInTheDocument();

    const search = screen.getByRole('searchbox', { name: /search patients/i });
    await user.type(search, 'meera');
    await waitFor(() => expect(patientNames()).toEqual(['Meera Iyer']));

    await user.clear(search);
    await user.type(search, 'nobody here');
    expect(await screen.findByText(/no patients match/i)).toBeInTheDocument();
    // The empty state offers registration in addition to the page header button.
    expect(screen.getAllByRole('button', { name: /register patient/i })).toHaveLength(2);
  });

  it('sorts patients by balance due', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PatientsPage />, { route: '/patients' });
    await screen.findByText('16 patients');
    expect(patientNames()[0]).toBe('Ananya Ghosh');

    await user.selectOptions(screen.getByRole('combobox', { name: /sort by/i }), 'balance');

    // Highest balance first (seed data: two patients owe ₹600).
    await waitFor(() => expect(patientNames().slice(0, 2).sort()).toEqual(['Daniel Fernandes', 'Kavya Reddy']));
  });
});
