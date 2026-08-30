// Matchers are registered by vitest/setup.web.ts; imported for the types.
import '@testing-library/jest-dom/vitest';
import {fireEvent, render, screen} from '@testing-library/react';
import {Collapsible} from '.';

const details = () => screen.getByTestId('more') as HTMLDetailsElement;

/** Mimics the browser flipping `open` and firing `toggle` on a summary click. */
function toggle(element: HTMLDetailsElement) {
  element.open = !element.open;
  fireEvent(element, new Event('toggle'));
}

describe('Collapsible (web)', () => {
  it('renders a <details> with the label in its <summary>', () => {
    render(
      <Collapsible label="Version 1.0.0" testID="more">
        <span>Built with expo-interface.</span>
      </Collapsible>,
    );
    const element = details();
    expect(element.tagName).toBe('DETAILS');
    expect(element).toHaveClass('ui-collapsible');
    expect(element).not.toHaveAttribute('open');
    const summary = element.querySelector('summary');
    expect(summary).toHaveClass('ui-collapsible__summary');
    expect(summary).toHaveTextContent('Version 1.0.0');
    expect(summary?.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(element.querySelector('.ui-collapsible__content')).toHaveTextContent('Built with expo-interface.');
  });

  it('starts open with defaultExpanded', () => {
    render(<Collapsible label="More" defaultExpanded testID="more"/>);
    expect(details()).toHaveAttribute('open');
  });

  it('toggles its own state when uncontrolled and reports each change', () => {
    const onExpandedChange = vi.fn();
    render(<Collapsible label="More" onExpandedChange={onExpandedChange} testID="more"/>);
    toggle(details());
    expect(onExpandedChange).toHaveBeenLastCalledWith(true);
    expect(details()).toHaveAttribute('open');
    toggle(details());
    expect(onExpandedChange).toHaveBeenLastCalledWith(false);
    expect(details()).not.toHaveAttribute('open');
    expect(onExpandedChange).toHaveBeenCalledTimes(2);
  });

  it('follows the expanded prop when controlled', () => {
    const onExpandedChange = vi.fn();
    const {rerender} = render(<Collapsible label="More" expanded={false} onExpandedChange={onExpandedChange} testID="more"/>);
    expect(details()).not.toHaveAttribute('open');
    toggle(details());
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    rerender(<Collapsible label="More" expanded onExpandedChange={onExpandedChange} testID="more"/>);
    expect(details()).toHaveAttribute('open');
    rerender(<Collapsible label="More" expanded={false} onExpandedChange={onExpandedChange} testID="more"/>);
    expect(details()).not.toHaveAttribute('open');
  });

  it('ignores toggle events that do not change the state', () => {
    const onExpandedChange = vi.fn();
    render(<Collapsible label="More" defaultExpanded onExpandedChange={onExpandedChange} testID="more"/>);
    fireEvent(details(), new Event('toggle'));
    expect(onExpandedChange).not.toHaveBeenCalled();
  });
});
