import {readFileSync} from 'node:fs';
import path from 'node:path';
import {render, screen} from '@testing-library/react';
import {staticPage} from '../__tests__/static-page';
import {AccentProvider} from '../accent';
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
    // No hint to place, so no name to place it against.
    expect(trigger.style.getPropertyValue('anchor-name')).toBe('');
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
      // The hint is placed against the trigger's name.
      expect(trigger.style.getPropertyValue('anchor-name')).toBe(`--${hint.id}`);
      expect(hint.style.getPropertyValue('position-anchor')).toBe(`--${hint.id}`);
    });
  });

  it('draws the hint on a material of its own, or the app\'s, in the label color, and as itself otherwise', async () => {
    await withInterest(() => {
      const hint = () => screen.getByRole('tooltip', {hidden: true});
      const {rerender} = render(<Tooltip text="Hint text" material="regular">Public</Tooltip>);
      expect(hint()).toHaveAttribute('data-material', 'regular');
      expect(hint()).toHaveAttribute('data-material-fill', 'element');
      expect(hint()).toHaveAttribute('data-material-edge', 'float');
      rerender(
        <AccentProvider overlayMaterial="thick">
          <Tooltip text="Hint text">Public</Tooltip>
        </AccentProvider>,
      );
      expect(hint()).toHaveAttribute('data-material', 'thick');
      rerender(<Tooltip text="Hint text">Public</Tooltip>);
      expect(hint()).not.toHaveAttribute('data-material');
    });
    // The stylesheet draws the fill and the shadow from the attributes; the hint's rule yields and keeps the text legible on the fill.
    const css = readFileSync(path.join(__dirname, 'tooltip.css'), 'utf8');
    const rule = css.slice(css.indexOf('.ui-tooltip__hint:where([data-material])'));
    expect(rule).toMatch(/^[^}]*background: transparent;/);
    expect(rule).toMatch(/^[^}]*color: var\(--color-label\);/);
    expect(rule).toMatch(/^[^}]*box-shadow: none;/);
  });

  it('takes the hint, and the name it is placed against, once a static page has hydrated', async () => {
    const tree = <Tooltip text="Hint text" testID="hint">Public</Tooltip>;
    // What a static export writes: the page rendered inside the whole
    // document, where `useId` answers other values than the hydration of
    // `#root` alone does. The server has no browser to ask, so the title
    // fallback, and no name from the server's id for a hint to be placed
    // against.
    const html = await staticPage(tree);
    await withInterest(() => {
      const container = document.body.appendChild(document.createElement('div'));
      container.innerHTML = html;
      const trigger = () => container.querySelector('[data-testid="hint"]') as HTMLElement;
      expect(trigger()).toHaveAttribute('title', 'Hint text');
      expect(trigger().style.getPropertyValue('anchor-name')).toBe('');
      expect(container.querySelector('[role="tooltip"]')).toBeNull();
      const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const {unmount} = render(tree, {container, hydrate: true});
        // Hydration matches the HTML, so React reports no difference, and the
        // render after it takes the hint, named and placed from one id.
        expect(errors).not.toHaveBeenCalled();
        const hint = container.querySelector('[role="tooltip"]') as HTMLElement;
        expect(hint).toHaveAttribute('popover', 'hint');
        expect(hint.id).toMatch(/^ui-tooltip-/);
        expect(trigger()).toHaveAttribute('interestfor', hint.id);
        expect(trigger()).not.toHaveAttribute('title');
        expect(trigger().style.getPropertyValue('anchor-name')).toBe(`--${hint.id}`);
        expect(hint.style.getPropertyValue('position-anchor')).toBe(`--${hint.id}`);
        unmount();
      } finally {
        errors.mockRestore();
        container.remove();
      }
    });
  });
});
