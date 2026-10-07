import {Platform, Text} from 'react-native';
import {render, screen} from '@testing-library/react-native';
import {HeaderAccessory} from '.';

describe(`HeaderAccessory (${Platform.OS})`, () => {
  it('draws the row where it is without a Screen around it', async () => {
    await render(<HeaderAccessory><Text>Strip</Text></HeaderAccessory>);
    expect(screen.getByText('Strip')).toBeOnTheScreen();
  });
});
