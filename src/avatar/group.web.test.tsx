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
    expect(screen.queryByRole('img')).toBeNull();
    screen.getByRole('button', {name: 'Alan Turing'}).click();
    expect(onPress).toHaveBeenCalledWith(people[1], 1);
  });

  it('makes a pressable count a button named for the rest, with no labelled face inside it', () => {
    const onPressMore = vi.fn();
    render(<AvatarGroup people={[{name: 'Ada Lovelace'}, {name: 'Grace Hopper'}, {name: 'Alan Turing'}, {name: 'Edsger Dijkstra'}]} max={1} onPressMore={onPressMore}/>);
    const more = screen.getByRole('button', {name: '3 more'});
    expect(screen.getAllByLabelText('3 more')).toEqual([more]);
    expect(screen.getByText('+3').parentElement).not.toHaveAttribute('aria-label');
    more.click();
    expect(onPressMore).toHaveBeenCalledTimes(1);
  });

  it('names, describes and marks the current face, and a disabled face does not press', () => {
    const onPress = vi.fn();
    const hint = 'Hold to go there once, without following';
    const people = [{name: 'Ada Lovelace', label: 'Follow Ada, on Notes', hint, selected: true}, {name: 'Grace Hopper', disabled: true}, {name: 'Alan Turing'}];
    render(<AvatarGroup people={people} onPress={onPress}/>);
    const ada = screen.getByRole('button', {name: 'Follow Ada, on Notes'});
    expect(ada).toHaveAttribute('aria-current', 'true');
    expect(ada).not.toHaveAttribute('aria-selected');
    expect(ada).toHaveAccessibleDescription(hint);
    const described = screen.getByText(hint);
    expect(described.id).not.toBe('');
    expect(ada).toHaveAttribute('aria-describedby', described.id);
    expect(described).not.toBeVisible();
    expect(screen.queryByLabelText('Ada Lovelace')).toBeNull();
    const alan = screen.getByRole('button', {name: 'Alan Turing'});
    expect(alan).not.toHaveAttribute('aria-current');
    expect(alan).not.toHaveAttribute('aria-describedby');
    const grace = screen.getByRole('button', {name: 'Grace Hopper'});
    expect(grace).toBeDisabled();
    grace.click();
    expect(onPress).not.toHaveBeenCalled();
    expect(getComputedStyle(screen.getByText('GH').parentElement!).opacity).toBe('0.5');
    alan.click();
    expect(onPress).toHaveBeenCalledWith(people[2], 2);
  });

  it('marks and describes a face that does not press, a picture named for the person', () => {
    render(<AvatarGroup people={[{name: 'Ada Lovelace', label: 'Ada, on Notes', hint: 'Editing the outline', selected: true}, {name: 'Alan Turing'}, {name: 'Grace Hopper'}]} max={2}/>);
    const ada = screen.getByRole('img', {name: 'Ada, on Notes'});
    expect(ada).toHaveAttribute('aria-current', 'true');
    expect(ada).toHaveAccessibleDescription('Editing the outline');
    expect(screen.getByRole('img', {name: 'Alan Turing'})).not.toHaveAttribute('aria-current');
    // The count is part of the picture too.
    expect(screen.getByRole('img', {name: '1 more'})).toHaveTextContent('+1');
    expect(screen.getAllByRole('img')).toHaveLength(3);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
