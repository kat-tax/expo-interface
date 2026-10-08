import {fireEvent, render, screen} from '@testing-library/react';
import * as icons from '../__stories__/icons';
import {Toolbar} from '.';

/**
 * The web bar draws its commands as the kit's small buttons, in a row of
 * their own that takes the density's gap: the bar's own pitch is the phones'.
 */
describe('Toolbar commands (web)', () => {
  const commands = [
    {label: 'Pen', icon: icons.add, hideLabel: true, active: true},
    {label: 'Erase', icon: icons.trash, hideLabel: true, tone: 'label' as const},
  ];

  it('spaces the commands by the density, packed tighter when compact', () => {
    const {unmount} = render(<Toolbar commands={commands}/>);
    const pen = screen.getByRole('button', {name: 'Pen'});
    expect(pen).toHaveClass('ui-button--small', 'ui-button--filled');
    expect(screen.getByRole('button', {name: 'Erase'})).toHaveClass('ui-button--text', 'ui-button--label');
    expect(getComputedStyle(pen.parentElement!).gap).toBe('8px');
    unmount();

    render(<Toolbar commands={commands} density="compact"/>);
    expect(getComputedStyle(screen.getByRole('button', {name: 'Pen'}).parentElement!).gap).toBe('2px');
  });

  it('draws a rule before a command that asks for one, and none before the first', () => {
    render(<Toolbar commands={[{label: 'Bold', separator: true}, {label: 'Italic'}, {label: 'Undo', separator: true}]}/>);
    const rules = screen.getAllByRole('separator');
    expect(rules).toHaveLength(1);
    expect(rules[0]).toHaveAttribute('aria-orientation', 'vertical');
    const precedes = (a: Element, b: Element) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    expect(precedes(screen.getByRole('button', {name: 'Italic'}), rules[0]!)).toBe(true);
    expect(precedes(rules[0]!, screen.getByRole('button', {name: 'Undo'}))).toBe(true);
  });

  it('draws a menu command as a menu of its own, and a secondary one\'s entries behind the overflow', () => {
    const onHeading = vi.fn();
    render(
      <Toolbar
        commands={[
          {label: 'Turn into', icon: icons.settings, hideLabel: true, items: [{label: 'Heading', onPress: onHeading}, {label: 'Quote'}]},
          {label: 'Sort', secondary: true, items: [{label: 'Name'}]},
        ]}
      />,
    );
    expect(screen.getByRole('button', {name: 'Turn into'})).toHaveAttribute('popovertarget');
    fireEvent.click(screen.getByRole('menuitem', {name: 'Heading', hidden: true}));
    expect(onHeading).toHaveBeenCalledTimes(1);
    // The secondary menu has no trigger of its own: its entries are in the overflow.
    expect(screen.queryByRole('button', {name: 'Sort'})).toBeNull();
    expect(screen.getByRole('button', {name: 'More'})).toBeInTheDocument();
    expect(screen.getByRole('menuitem', {name: 'Name', hidden: true})).toBeInTheDocument();
  });

  it('keeps a toggle\'s state in the overflow as the menu\'s check', () => {
    render(<Toolbar commands={[{label: 'Undo'}, {label: 'Spellcheck', secondary: true, active: true}, {label: 'Wrap', secondary: true, active: false}]}/>);
    expect(screen.getByRole('menuitem', {name: 'Spellcheck', hidden: true})).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('menuitem', {name: 'Wrap', hidden: true})).not.toHaveAttribute('aria-current');
  });
});
