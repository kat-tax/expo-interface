// Matchers are registered by vitest/setup.web.ts; imported for the types.
import '@testing-library/jest-dom/vitest';
import type {ReactNode} from 'react';
import {render, screen} from '@testing-library/react';
import {Tooltip} from '.';

/** The subset of `react-dom/client` used below (the package ships no types here). */
interface ReactDOMClient {
  createRoot(container: Element): {render(element: ReactNode): void; unmount(): void};
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
    // `interestfor` support is detected once at module load, so re-load the
    // component from a reset module registry (with React and the renderer
    // imported alongside, so hooks and the renderer agree) after polyfilling
    // the detection.
    Object.defineProperty(HTMLButtonElement.prototype, 'interestForElement', {value: null, configurable: true});
    const container = document.body.appendChild(document.createElement('div'));
    try {
      vi.resetModules();
      const React = await vi.importActual<typeof import('react')>('react');
      const {createRoot} = await vi.importActual<ReactDOMClient>('react-dom/client');
      const {Tooltip: InterestTooltip} = await vi.importActual<typeof import('.')>('.');
      const root = createRoot(container);
      React.act(() => {
        root.render(<InterestTooltip text="Hint text" testID="hint">Public</InterestTooltip>);
      });
      try {
        const trigger = container.querySelector('[data-testid="hint"]');
        const hint = container.querySelector('[role="tooltip"]');
        expect(trigger).not.toBeNull();
        expect(hint).not.toBeNull();
        expect(trigger).not.toHaveAttribute('title');
        expect(trigger).toHaveAttribute('interestfor', hint?.id);
        expect(hint?.id).toMatch(/^ui-tooltip-/);
        expect(hint).toHaveAttribute('popover', 'hint');
        expect(hint).toHaveClass('ui-tooltip__hint');
        expect(hint).toHaveTextContent('Hint text');
      } finally {
        React.act(() => root.unmount());
      }
    } finally {
      container.remove();
      delete (HTMLButtonElement.prototype as {interestForElement?: unknown}).interestForElement;
    }
  });
});
