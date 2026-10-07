import {render, screen} from '@testing-library/react-native';
import {StyleSheet} from 'react-native';
import {colors} from '../theme';
import {island} from 'expo-vitest/windows';
import {colorOf} from './shared';
import {Avatar} from '.';

const PICTURE = 'ExpoInterfacePersonPicture';

describe('Avatar (windows)', () => {
  it('renders a PersonPicture island with the initials and the hashed color', async () => {
    await render(<Avatar name="Ada Lovelace" testID="ada"/>);
    expect(island(PICTURE).props).toMatchObject({
      initials: 'AL',
      displayName: 'Ada Lovelace',
      color: colorOf('Ada Lovelace'),
      size: 28,
      theme: 'light',
      style: {width: 28, height: 28},
      testID: 'ada',
    });
  });

  it('takes its own initials, color and size', async () => {
    await render(<Avatar name="Ada Lovelace" initials="A" color="#123456" size={40}/>);
    expect(island(PICTURE).props).toMatchObject({initials: 'A', color: '#123456', size: 40, style: {width: 40, height: 40}});
  });

  it('draws a ring around the picture, the picture inside it, and dims the two', async () => {
    await render(<Avatar name="Ada Lovelace" size={40} ring="background" dimmed testID="ada"/>);
    expect(island(PICTURE).props).toMatchObject({size: 36, style: {width: 36, height: 36}});
    const frame = screen.getByTestId('ada').parent!;
    expect(StyleSheet.flatten(frame.props.style)).toMatchObject({width: 40, borderWidth: 2, borderColor: colors.light.background, opacity: 0.5});
    await render(<Avatar name="Grace Hopper" ring="#FF00FF" testID="grace"/>);
    expect(StyleSheet.flatten(screen.getByTestId('grace').parent!.props.style)).toMatchObject({borderColor: '#FF00FF'});
    await render(<Avatar name="Grace Hopper" dimmed testID="away"/>);
    expect(island(PICTURE).props.size).toBe(28);
    expect(StyleSheet.flatten(screen.getByTestId('away').parent!.props.style)).toMatchObject({opacity: 0.5});
  });
});
