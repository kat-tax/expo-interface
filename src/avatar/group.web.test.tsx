import {render, screen} from '@testing-library/react';
import {AvatarGroup} from '.';

describe('AvatarGroup (web)', () => {
  it('makes a pressable face a button named for the person, with no labelled circle inside it', () => {
    const onPress = vi.fn();
    const people = [{name: 'Ada Lovelace'}, {name: 'Alan Turing'}];
    render(<AvatarGroup people={people} onPress={onPress}/>);
    const ada = screen.getByRole('button', {name: 'Ada Lovelace'});
    expect(screen.getAllByLabelText('Ada Lovelace')).toEqual([ada]);
    expect(screen.getByText('AL').parentElement).not.toHaveAttribute('aria-label');
    screen.getByRole('button', {name: 'Alan Turing'}).click();
    expect(onPress).toHaveBeenCalledWith(people[1], 1);
  });
});
