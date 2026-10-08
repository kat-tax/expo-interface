// Matchers are registered by expo-vitest's web setup; imported for the types.
import '@testing-library/jest-dom/vitest';
import type {ReactElement} from 'react';
import {render, screen} from '@testing-library/react';
import {Tooltip} from '.';

/** Gives jsdom the Interest Invoker API for the length of `run`. */
async function withInterest(run: () => void | Promise<void>) {
  Object.defineProperty(HTMLButtonElement.prototype, 'interestForElement', {value: null, configurable: true});
  try {
    await run();
  } finally {
    delete (HTMLButtonElement.prototype as {interestForElement?: unknown}).interestForElement;
  }
}

describe('Tooltip (web)', () => {
  it('falls back to the title attribute without the Interest Invoker API', () => {
    // jsdom has no `interestForElement`, so the platform tooltip is used.
    render(
      <Tooltip text="Anyone with the link can view" testID="hint">
        <span>Public</span>
      </Tooltip>,
    );
    const trigger = screen.getByTestId('hint');
    expect(trigger.tagName).toBe('BUTTON');
    expect(trigger).toHaveAttribute('type', 'button');
    expect(trigger).toHaveClass('ui-tooltip');
    expect(trigger).toHaveAttribute('title', 'Anyone with the link can view');
    expect(trigger).not.toHaveAttribute('interestfor');
    expect(trigger).toHaveTextContent('Public');
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('exposes the trigger as a button with the content as its name', () => {
    render(
      <Tooltip text="Copied">
        <span>Copy link</span>
      </Tooltip>,
    );
    expect(screen.getByRole('button', {name: 'Copy link'})).toBeInTheDocument();
  });

  it('renders a popover="hint" when the Interest Invoker API exists', async () => {
    // Support is asked at render, so the API added here is seen without reloading the module.
    await withInterest(() => {
      render(<Tooltip text="Hint text" testID="hint">Public</Tooltip>);
      const trigger = screen.getByTestId('hint');
      const hint = screen.getByRole('tooltip', {hidden: true});
      expect(trigger).not.toHaveAttribute('title');
      expect(trigger).toHaveAttribute('interestfor', hint.id);
      expect(hint.id).toMatch(/^ui-tooltip-/);
      expect(hint).toHaveAttribute('popover', 'hint');
      expect(hint).toHaveClass('ui-tooltip__hint');
      expect(hint).toHaveTextContent('Hint text');
    });
  });

  it('takes the hint once a static page has hydrated', async () => {
    // The one function of `react-dom/server` this calls: the repository carries no types for react-dom.
    const {renderToString} = (await import('react-dom/server' as string)) as {renderToString: (element: ReactElement) => string};
    await withInterest(() => {
      const tree = <Tooltip text="Hint text" testID="hint">Public</Tooltip>;
      // What a static export writes: the server has no browser to ask, so the title fallback.
      const container = document.body.appendChild(document.createElement('div'));
      container.innerHTML = renderToString(tree);
      const trigger = () => container.querySelector('[data-testid="hint"]') as HTMLElement;
      expect(trigger()).toHaveAttribute('title', 'Hint text');
      expect(container.querySelector('[role="tooltip"]')).toBeNull();
      const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const {unmount} = render(tree, {container, hydrate: true});
        // Hydration matches the HTML, so React reports no difference, and the
        // render after it takes the hint.
        expect(errors).not.toHaveBeenCalled();
        const hint = container.querySelector('[role="tooltip"]') as HTMLElement;
        expect(hint).toHaveAttribute('popover', 'hint');
        expect(trigger()).toHaveAttribute('interestfor', hint.id);
        expect(trigger()).not.toHaveAttribute('title');
        unmount();
      } finally {
        errors.mockRestore();
        container.remove();
      }
    });
  });
});
