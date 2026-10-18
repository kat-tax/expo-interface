import {fireEvent as fireDom, render as renderDom, screen as dom} from '@testing-library/react';
import * as icons from '../__stories__/icons';
import {EmptyState} from '.';

describe('EmptyState (web)', () => {
  it('draws the column, and reads as one thing rather than three loose lines', () => {
    renderDom(
      <EmptyState title="No drops yet" description="Anything you share shows up here." icon={icons.add} testID="empty"/>,
    );
    expect(dom.getByText('No drops yet')).toBeInTheDocument();
    expect(dom.getByText('Anything you share shows up here.')).toBeInTheDocument();
    expect(dom.getByLabelText('No drops yet. Anything you share shows up here.')).toBeInTheDocument();
  });

  it('needs nothing but a title, and puts an action under the description', () => {
    renderDom(<EmptyState title="Nothing here" testID="bare"/>);
    expect(dom.getByLabelText('Nothing here')).toBeInTheDocument();
    renderDom(<EmptyState title="No drops" action={<button type="button">New drop</button>} testID="acting"/>);
    expect(dom.getByRole('button', {name: 'New drop'})).toBeInTheDocument();
  });

  it('draws an action given as data as the kit\'s button, and spins while loading', () => {
    const onPress = vi.fn();
    renderDom(<EmptyState title="No drops" action={{label: 'New drop', onPress, variant: 'outlined'}} testID="acting"/>);
    const button = dom.getByRole('button', {name: 'New drop'});
    expect(button).toHaveClass('ui-button--outlined');
    fireDom.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
    renderDom(<EmptyState title="No files" action={{label: 'Add one'}}/>);
    expect(dom.getByRole('button', {name: 'Add one'})).not.toHaveAttribute('data-testid');
    renderDom(<EmptyState title="Opening" description="One moment." loading icon={icons.add} testID="busy"/>);
    expect(dom.getByTestId('busy').querySelector('.ui-progress-ring--indeterminate')).toBeTruthy();
    expect(dom.getByTestId('busy').querySelector('.ui-symbol')).toBeNull();
  });

  it('lets the description be selected, unless told not to', () => {
    renderDom(<EmptyState title="Failed" description="The file is gone." testID="failed"/>);
    expect(dom.getByText('The file is gone.').style.userSelect).toBe('text');
    renderDom(<EmptyState title="Failed" description="No reason." selectable={false} testID="plain"/>);
    expect(dom.getByText('No reason.').style.userSelect).toBe('');
  });
});
