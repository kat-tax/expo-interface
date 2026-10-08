import {render, screen} from '@testing-library/react';
import * as icons from '../__stories__/icons';
import {ListItem} from '.';

describe('ListItem slots (web)', () => {
  it('draws an icon at the start in its tone, before the leading content', () => {
    render(
      <ListItem icon={icons.share} iconTone="accent" leading={<span>L</span>} testID="row">
        Share
      </ListItem>,
    );
    const slot = screen.getByTestId('row').querySelector('.ui-list-item__slot')!;
    const glyph = slot.querySelector<HTMLElement>('.ui-symbol')!;
    expect(glyph).toHaveTextContent('share');
    expect(glyph.style.color).toBe('var(--color-tint)');
    expect(glyph.style.fontSize).toBe('24px');
    expect(slot.textContent).toBe('shareL');
  });

  it('draws a value and a badge at the end, before the trailing content, and names the row from its slots', () => {
    render(
      <ListItem supporting="Edited" value="2 KB" badge={3} trailing={<span>T</span>} onPress={() => {}} testID="row">
        Essay
      </ListItem>,
    );
    const row = screen.getByTestId('row');
    expect(row).toHaveAttribute('aria-label', 'Essay, Edited, 2 KB, 3 new');
    // No leading content, so no leading slot: the one slot is the trailing one.
    expect(row.querySelectorAll('.ui-list-item__slot')).toHaveLength(1);
    const trailing = row.querySelector('.ui-list-item__slot')!;
    expect(trailing.querySelector('.ui-list-item__value')).toHaveTextContent('2 KB');
    expect(trailing.querySelector('.ui-badge')).toHaveAttribute('aria-label', '3 new');
    expect(trailing.textContent?.endsWith('T')).toBe(true);
  });

  it('draws a dot for a badge of true, and marks the current row', () => {
    render(
      <>
        <ListItem badge selected testID="current">Current</ListItem>
        <ListItem action={{label: 'Open', onPress: () => {}}} selected onPress={() => {}} testID="acting">Acting</ListItem>
        <ListItem testID="plain">Plain</ListItem>
      </>,
    );
    const current = screen.getByTestId('current');
    expect(current).toHaveClass('ui-list-item--selected');
    expect(current).toHaveAttribute('aria-current', 'true');
    expect(current.querySelector('.ui-badge--dot')).toBeTruthy();
    expect(current).toHaveAttribute('aria-label', 'Current, new');
    // With an action the outer row carries the state and the inner control the name.
    const acting = screen.getByTestId('acting');
    expect(acting).toHaveAttribute('aria-current', 'true');
    expect(acting.querySelector('.ui-list-item__row')).toHaveAttribute('aria-label', 'Acting');
    expect(screen.getByTestId('plain')).not.toHaveAttribute('aria-current');
    expect(screen.getByTestId('plain')).toHaveAttribute('aria-label', 'Plain');
  });

  it('draws the badge in the color it is given, with a count that reads on a token', () => {
    render(
      <>
        <ListItem badge={3} badgeColor="highlight" testID="token">Essay</ListItem>
        <ListItem badge={2} badgeColor="#123456" testID="raw">Notes</ListItem>
        <ListItem badge={4} badgeColor="gold" testID="named">Drafts</ListItem>
        <ListItem badge testID="plain">Plain</ListItem>
      </>,
    );
    const token = screen.getByTestId('token').querySelector<HTMLElement>('.ui-badge')!;
    expect(token.style.getPropertyValue('--ui-badge-fill')).toBe('var(--color-highlight)');
    // The variable cannot be read for its color, so the badge picks the count's from the palette.
    expect(token.style.getPropertyValue('--ui-badge-on-fill')).toBe('#000000');
    const raw = screen.getByTestId('raw').querySelector<HTMLElement>('.ui-badge')!;
    expect(raw.style.getPropertyValue('--ui-badge-fill')).toBe('#123456');
    expect(raw.style.getPropertyValue('--ui-badge-on-fill')).toBe('#FFFFFF');
    // A named color is read too: a count on gold is black.
    const named = screen.getByTestId('named').querySelector<HTMLElement>('.ui-badge')!;
    expect(named.style.getPropertyValue('--ui-badge-fill')).toBe('gold');
    expect(named.style.getPropertyValue('--ui-badge-on-fill')).toBe('#000000');
    const plain = screen.getByTestId('plain').querySelector<HTMLElement>('.ui-badge')!;
    expect(plain.style.getPropertyValue('--ui-badge-fill')).toBe('var(--color-destructive)');
  });

  it('draws a value alone, without a badge', () => {
    render(<ListItem value="2 KB" testID="row">Essay</ListItem>);
    const row = screen.getByTestId('row');
    expect(row.querySelector('.ui-list-item__value')).toHaveTextContent('2 KB');
    expect(row.querySelector('.ui-badge')).toBeNull();
    expect(row).toHaveAttribute('aria-label', 'Essay, 2 KB');
  });

  it('leaves the name to content of the app\'s own', () => {
    render(<ListItem testID="row"><em>Rich</em></ListItem>);
    expect(screen.getByTestId('row')).not.toHaveAttribute('aria-label');
  });
});
