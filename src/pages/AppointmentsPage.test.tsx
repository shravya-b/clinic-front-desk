import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { resetDb } from '../services/db';
import { renderWithProviders } from '../test/render';
import { AppointmentsPage } from './AppointmentsPage';

beforeEach(() => {
  resetDb();
});

const column = (name: string) => screen.getByRole('region', { name });

/** The queue card (article) containing a patient's name. */
const cardFor = (region: HTMLElement, patient: string) =>
  within(region).getByRole('button', { name: patient }).closest('article') as HTMLElement;

describe('AppointmentsPage', () => {
  it('moves a waiting patient into consultation and updates the queue', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppointmentsPage />, { route: '/appointments' });

    // Dr. Mehta is free in the seed data, so Ananya Ghosh can be called in.
    const waiting = await screen.findByRole('region', { name: 'Waiting' });
    const card = cardFor(waiting, 'Ananya Ghosh');
    expect(within(card).getByText(/next up/i)).toBeInTheDocument();

    await user.click(within(card).getByRole('button', { name: /start consultation/i }));

    expect(await within(column('In consultation')).findByRole('button', { name: 'Ananya Ghosh' })).toBeInTheDocument();
    expect(within(column('Waiting')).queryByRole('button', { name: 'Ananya Ghosh' })).not.toBeInTheDocument();
    expect(await screen.findByText(/is now with Dr\. Vikram Mehta/)).toBeInTheDocument();
  });

  it('prevents starting a second consultation while the doctor is busy', async () => {
    renderWithProviders(<AppointmentsPage />, { route: '/appointments' });

    // Dr. Rao is already seeing a patient.
    const waiting = await screen.findByRole('region', { name: 'Waiting' });
    const busy = within(cardFor(waiting, 'Arjun Nair')).getByRole('button', { name: /doctor busy|is with another patient/i });
    expect(busy).toBeDisabled();
  });

  it('filters the board by doctor', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppointmentsPage />, { route: '/appointments' });
    await screen.findByRole('region', { name: 'Waiting' });

    await user.click(screen.getByRole('button', { name: /dr\. thomas/i }));

    const waiting = column('Waiting');
    expect(within(waiting).getByRole('button', { name: 'Rohan Gupta' })).toBeInTheDocument();
    expect(within(waiting).queryByRole('button', { name: 'Arjun Nair' })).not.toBeInTheDocument();
  });
});
