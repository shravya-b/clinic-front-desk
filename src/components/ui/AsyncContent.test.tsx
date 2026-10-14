import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { QueryResult } from '../../hooks/useQuery';
import { AsyncContent } from './AsyncContent';

function query<T>(overrides: Partial<QueryResult<T>>): QueryResult<T> {
  return { data: undefined, error: null, isLoading: false, isRefreshing: false, reload: vi.fn(), ...overrides };
}

const renderList = (q: QueryResult<string[]>) =>
  render(
    <AsyncContent
      query={q}
      loadingLabel="Loading items…"
      isEmpty={(items) => items.length === 0}
      empty={<p>Nothing here</p>}
    >
      {(items) => <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>}
    </AsyncContent>,
  );

describe('AsyncContent', () => {
  it('announces loading while there is no data', () => {
    renderList(query({ isLoading: true }));
    expect(screen.getByRole('status')).toHaveTextContent('Loading items…');
  });

  it('shows the error with a working retry', async () => {
    const reload = vi.fn();
    renderList(query({ error: new Error('Server unavailable'), reload }));

    expect(screen.getByRole('alert')).toHaveTextContent('Server unavailable');
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(reload).toHaveBeenCalledOnce();
  });

  it('renders the empty state for an empty result', () => {
    renderList(query({ data: [] }));
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('keeps showing data when a background refresh fails, and says it may be stale', async () => {
    const reload = vi.fn();
    renderList(query({ data: ['Token #1'], error: new Error('flaky'), reload }));

    expect(screen.getByRole('listitem')).toHaveTextContent('Token #1');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/showing the last loaded data/i);

    await userEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(reload).toHaveBeenCalledOnce();
  });
});
