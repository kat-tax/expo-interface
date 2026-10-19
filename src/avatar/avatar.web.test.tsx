import {render as renderDom, screen as dom} from '@testing-library/react';
import {Avatar} from '.';

describe('Avatar (web)', () => {
  it('draws the initials in a named circle', () => {
    renderDom(<Avatar name="Ada Lovelace" testID="peer"/>);
    expect(dom.getByText('AL')).toBeInTheDocument();
    expect(dom.getByLabelText('Ada Lovelace')).toBeInTheDocument();
  });

  it('is a picture of the person, which a screen reader reads by their name', () => {
    renderDom(<Avatar name="Ada Lovelace" testID="peer"/>);
    expect(dom.getByRole('img', {name: 'Ada Lovelace'})).toBe(dom.getByTestId('peer'));
  });
});
