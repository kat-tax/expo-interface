import {render} from '@testing-library/react-native';
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
});
