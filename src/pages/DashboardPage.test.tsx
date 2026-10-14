import { act, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resetDb } from '../services/db';
import { setNetworkMode } from '../services/request';
import { renderWithProviders } from '../test/render';
import { DashboardPage } from './DashboardPage';

beforeEach(() => {
  resetDb();
});

afterEach(() => {
  setNetworkMode('normal');
});

describe('DashboardPage', () => {
  it('summarises today: stats, live queue, collections by method and pending payments', async () => {
    renderWithProviders(<DashboardPage />);

    expect(await screen.findByText('Waiting now')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Live queue' })).toBeInTheDocument();
    expect(screen.getByText('By payment method')).toBeInTheDocument();

    const pending = screen.getByRole('table', { name: 'Pending payments' });
    expect(within(pending).getAllByRole('button', { name: 'Collect' }).length).toBeGreaterThan(0);
  });

  it('keeps the data on screen and flags it as stale when the network drops', async () => {
    renderWithProviders(<DashboardPage />);
    expect(await screen.findByText('Waiting now')).toBeInTheDocument();

    act(() => setNetworkMode('offline'));

    expect(await screen.findByText(/showing the last loaded data/i)).toBeInTheDocument();
    expect(screen.getByText('Waiting now')).toBeInTheDocument();
  });
});
