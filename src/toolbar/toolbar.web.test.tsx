import {render, screen} from '@testing-library/react';
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
});
