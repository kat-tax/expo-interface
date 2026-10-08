import {Platform, StyleSheet} from 'react-native';
import {fireEvent, render, screen} from '@testing-library/react-native';
import {colors} from '../theme';
import {AvatarGroup} from '.';

const people = [{name: 'Ada Lovelace'}, {name: 'Grace Hopper', dimmed: true, ring: '#FF00FF'}, {name: 'Alan Turing'}, {name: 'Edsger Dijkstra'}, {name: 'Barbara Liskov'}];

describe(`AvatarGroup (${Platform.OS})`, () => {
  it('overlaps the faces, parted by rings in the fill behind, and counts the rest', async () => {
    await render(<AvatarGroup people={people} testID="peers"/>);
    expect(screen.getByLabelText('Ada Lovelace')).toBeOnTheScreen();
    expect(screen.getByLabelText('Alan Turing')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Edsger Dijkstra')).toBeNull();
    expect(screen.getByText('+2')).toBeOnTheScreen();
    expect(screen.getByLabelText('2 more')).toBeOnTheScreen();
    const ada = StyleSheet.flatten(screen.getByLabelText('Ada Lovelace').props.style);
    expect(ada).toMatchObject({width: 24, borderWidth: 2, borderColor: colors.light.background});
    // A person's own ring wins, and an away person is dimmed.
    expect(StyleSheet.flatten(screen.getByLabelText('Grace Hopper').props.style)).toMatchObject({borderColor: '#FF00FF', opacity: 0.5});
    // Each face after the first overlaps the one before by a quarter.
    expect(StyleSheet.flatten(screen.getByLabelText('Ada Lovelace').parent!.props.style)).toBeUndefined();
    expect(StyleSheet.flatten(screen.getByLabelText('Alan Turing').parent!.props.style)).toMatchObject({marginLeft: -6});
  });

  it('presses, and presses and holds, a face and the count', async () => {
    const onPress = vi.fn();
    const onLongPress = vi.fn();
    const onPressMore = vi.fn();
    await render(<AvatarGroup people={people} max={2} size={32} ring="#101010" onPress={onPress} onLongPress={onLongPress} onPressMore={onPressMore}/>);
    const grace = screen.getAllByRole('button', {name: 'Grace Hopper'})[0];
    await fireEvent.press(grace);
    expect(onPress).toHaveBeenCalledWith(people[1], 1);
    await fireEvent(grace, 'longPress');
    expect(onLongPress).toHaveBeenCalledWith(people[1], 1);
    await fireEvent.press(screen.getByRole('button', {name: '3 more'}));
    expect(onPressMore).toHaveBeenCalledTimes(1);
    expect(StyleSheet.flatten(screen.getByText('+3').parent!.props.style)).toMatchObject({borderColor: '#101010', width: 32});
    // The count's button is its one stop: the face inside it is silent.
    expect(screen.getAllByLabelText('3 more')).toEqual([screen.getByRole('button', {name: '3 more'})]);
    expect(screen.getByText('+3').parent!.props.accessible).toBe(false);
  });

  it('presses only where it is told what to do, and draws no count with nothing more', async () => {
    const onLongPress = vi.fn();
    await render(<AvatarGroup people={people.slice(0, 2)} onLongPress={onLongPress}/>);
    expect(screen.queryByText(/^\+/)).toBeNull();
    await fireEvent.press(screen.getAllByRole('button', {name: 'Ada Lovelace'})[0]);
    await fireEvent(screen.getAllByRole('button', {name: 'Ada Lovelace'})[0], 'longPress');
    expect(onLongPress).toHaveBeenCalledWith(people[0], 0);
    await render(<AvatarGroup people={people} max={0}/>);
    expect(screen.getByText('+5')).toBeOnTheScreen();
    expect(StyleSheet.flatten(screen.getByText('+5').parent!.parent!.props.style)).toMatchObject({marginLeft: -0});
  });

  it('makes a pressable face one stop, the button, with the circle inside it silent', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    await render(<AvatarGroup people={[{name: 'Ada Lovelace', key: 'ada-1'}, {name: 'Alan Turing'}]} onPress={() => {}}/>);
    const ada = screen.getByRole('button', {name: 'Ada Lovelace'});
    expect(screen.getAllByLabelText('Ada Lovelace')).toEqual([ada]);
    const circle = screen.getByText('AL').parent!;
    expect(circle.props.accessible).toBe(false);
    expect(circle.props.accessibilityLabel).toBeUndefined();
    // A person's key tells the faces apart; it is not spread into the circle.
    expect(error.mock.calls.some(call => call.join(' ').includes('"key" prop'))).toBe(false);
    error.mockRestore();
  });

  it('names a face by its label and hint, announces the selected one, and leaves a disabled one unpressed and dimmed', async () => {
    const onPress = vi.fn();
    const onLongPress = vi.fn();
    const hint = 'Hold to go there once, without following';
    await render(
      <AvatarGroup
        people={[{name: 'Ada Lovelace', label: 'Follow Ada, on Notes', hint, selected: true}, {name: 'Grace Hopper', disabled: true}, {name: 'Alan Turing'}]}
        onPress={onPress}
        onLongPress={onLongPress}
      />,
    );
    const ada = screen.getByRole('button', {name: 'Follow Ada, on Notes', selected: true});
    expect(screen.getByHintText(hint)).toBe(ada);
    expect(ada.props['aria-current']).toBeUndefined();
    expect(screen.queryByLabelText('Ada Lovelace')).toBeNull();
    expect(screen.queryByText(hint)).toBeNull();
    expect(screen.getByRole('button', {name: 'Alan Turing'})).not.toBeSelected();
    expect(screen.getByRole('button', {name: 'Alan Turing'}).props.accessibilityState?.selected).toBeUndefined();
    expect(screen.getAllByLabelText('Alan Turing')).toHaveLength(1);
    const grace = screen.getByRole('button', {name: 'Grace Hopper', disabled: true});
    await fireEvent.press(grace);
    await fireEvent(grace, 'longPress');
    expect(onPress).not.toHaveBeenCalled();
    expect(onLongPress).not.toHaveBeenCalled();
    expect(StyleSheet.flatten(screen.getByText('GH').parent!.props.style)).toMatchObject({opacity: 0.5});
    expect(StyleSheet.flatten(screen.getByText('AT').parent!.props.style).opacity).toBeUndefined();
  });

  it('names and announces a face that does not press', async () => {
    await render(<AvatarGroup people={[{name: 'Ada Lovelace', label: 'Ada, on Notes', hint: 'Editing the outline', selected: true}, {name: 'Alan Turing'}]}/>);
    const ada = screen.getByLabelText('Ada, on Notes');
    expect(StyleSheet.flatten(ada.props.style)).toMatchObject({width: 24});
    expect(ada).toBeSelected();
    expect(ada.props.accessibilityHint).toBe('Editing the outline');
    // Read as the person, not as an image.
    expect(ada.props.role).toBeUndefined();
    expect(screen.getByLabelText('Alan Turing')).not.toBeSelected();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('names a face with an empty label by the name, and gives one with an empty hint none', async () => {
    await render(<AvatarGroup people={[{name: 'Ada Lovelace', label: '', hint: ''}]} onPress={() => {}}/>);
    const ada = screen.getByRole('button', {name: 'Ada Lovelace'});
    expect(ada.props.accessibilityLabel).toBe('Ada Lovelace');
    expect(ada.props.accessibilityHint).toBeUndefined();
    await render(<AvatarGroup people={[{name: 'Ada Lovelace', label: ''}]}/>);
    expect(screen.getByLabelText('Ada Lovelace').props.accessibilityLabel).toBe('Ada Lovelace');
  });
});
