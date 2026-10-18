import {render as renderDom, screen as dom} from '@testing-library/react';
import {Spinner} from '.';

describe('Spinner (web)', () => {
  it('spins an indeterminate ring', () => {
    renderDom(<Spinner testID="loading"/>);
    const ring = dom.getByTestId('loading');
    expect(ring).toHaveClass('ui-progress-ring--indeterminate');
    expect(ring).not.toHaveAttribute('aria-valuenow');
  });
});
