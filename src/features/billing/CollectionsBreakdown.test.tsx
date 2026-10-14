import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CollectionsBreakdown } from './CollectionsBreakdown';

describe('CollectionsBreakdown', () => {
  it('labels every method with its amount, count and share, so colour is never the only cue', () => {
    render(
      <CollectionsBreakdown
        payments={[
          { amount: 300, method: 'cash' },
          { amount: 700, method: 'upi' },
        ]}
      />,
    );

    const items = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(items.map((li) => li.textContent)).toEqual([
      expect.stringMatching(/Cash.*300.*1 payment · 30%/),
      expect.stringMatching(/UPI.*700.*1 payment · 70%/),
      expect.stringMatching(/Card.*0.*0 payments$/),
    ]);
  });

  it('renders nothing when no money was received', () => {
    const { container } = render(<CollectionsBreakdown payments={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
