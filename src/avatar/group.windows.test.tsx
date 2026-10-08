import {fireEvent, render, screen} from '@testing-library/react-native';
import {islands} from 'expo-vitest/windows';
import {AvatarGroup} from '.';

describe('AvatarGroup (windows)', () => {
  it('draws its faces in React Native, where a press reaches them, not as PersonPicture islands', async () => {
    const onPress = vi.fn();
    await render(<AvatarGroup people={[{name: 'Ada Lovelace'}, {name: 'Grace Hopper'}]} onPress={onPress}/>);
    expect(islands('ExpoInterfacePersonPicture')).toHaveLength(0);
    await fireEvent.press(screen.getAllByRole('button', {name: 'Grace Hopper'})[0]);
    expect(onPress).toHaveBeenCalledWith({name: 'Grace Hopper'}, 1);
    // One UIA element per face: the button, with the circle inside it silent.
    expect(screen.getAllByLabelText('Grace Hopper')).toEqual([screen.getByRole('button', {name: 'Grace Hopper'})]);
    expect(screen.getByText('GH').parent!.props.accessible).toBe(false);
  });

  it('gives a face its label, its hint as help text and its selected state, and a disabled face takes no press', async () => {
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
    expect(islands('ExpoInterfacePersonPicture')).toHaveLength(0);
    const ada = screen.getByRole('button', {name: 'Follow Ada, on Notes', selected: true});
    expect(ada.props.accessibilityHint).toBe(hint);
    expect(ada.props['aria-current']).toBeUndefined();
    expect(screen.queryByLabelText('Ada Lovelace')).toBeNull();
    expect(screen.queryByText(hint)).toBeNull();
    // Only the selected face is selectable: any `selected`, false included, adds the pattern.
    expect(screen.getByRole('button', {name: 'Alan Turing'}).props.accessibilityState?.selected).toBeUndefined();
    const grace = screen.getByRole('button', {name: 'Grace Hopper', disabled: true});
    await fireEvent.press(grace);
    await fireEvent(grace, 'longPress');
    expect(onPress).not.toHaveBeenCalled();
    expect(onLongPress).not.toHaveBeenCalled();
  });
});
