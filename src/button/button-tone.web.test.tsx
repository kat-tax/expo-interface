// Matchers are registered by vitest/setup.web.ts; imported for the types.
import '@testing-library/jest-dom/vitest';
import {render, screen} from '@testing-library/react';
import {Button} from '.';

describe('Button tone (web)', () => {
  it('draws the text variant in the label color with the label tone', () => {
    render(<Button label="Undo" variant="text" tone="label"/>);
    expect(screen.getByRole('button', {name: 'Undo'})).toHaveClass('ui-button--text', 'ui-button--label');
  });

  it('ignores the label tone for filled buttons, the destructive role and an explicit color', () => {
    render(
      <>
        <Button label="Go" tone="label"/>
        <Button label="Delete" variant="text" role="destructive" tone="label"/>
        <Button label="Custom" variant="text" tone="label" color="#FFCC00"/>
      </>,
    );
    expect(screen.getByRole('button', {name: 'Go'})).not.toHaveClass('ui-button--label');
    expect(screen.getByRole('button', {name: 'Delete'})).not.toHaveClass('ui-button--label');
    expect(screen.getByRole('button', {name: 'Delete'})).toHaveClass('ui-button--destructive');
    const custom = screen.getByRole('button', {name: 'Custom'});
    expect(custom).not.toHaveClass('ui-button--label');
    expect(custom.style.getPropertyValue('--ui-button-accent')).toBe('#FFCC00');
  });
});
