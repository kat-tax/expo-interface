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
  });
});
