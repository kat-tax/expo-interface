import {useEffect, useState} from 'react';
import {Text} from 'react-native';
import {act, screen} from '@testing-library/react-native';
import {Stack} from '../router/stack';
import {renderApp} from 'expo-vitest/router';
import {HeaderAccessory} from '.';

/** Takes the row away, or puts it back, from the test. */
let show: (shown: boolean) => void = () => {};

/** A screen's own row, rendered conditionally. */
function Row() {
  const [shown, setShown] = useState(true);
  useEffect(() => {
    show = next => setShown(next);
  });
  return shown ? <HeaderAccessory><Text testID="strip">Strip</Text></HeaderAccessory> : null;
}

describe('HeaderAccessory (windows)', () => {
  it('puts the row under the header row while it is rendered, and takes it away when it is not', async () => {
    await renderApp({
      _layout: () => (
        <Stack screenOptions={{headerShown: true}}>
          <Stack.Screen name="index" options={{title: 'Drops'}}/>
        </Stack>
      ),
      index: () => (
        <>
          <Row/>
          <Text>Home screen</Text>
        </>
      ),
    });
    const title = screen.getByText('Drops');
    expect(title.parent!).not.toContainElement(screen.getByTestId('strip'));
    expect(title.parent!.parent!).toContainElement(screen.getByTestId('strip'));
    await act(async () => show(false));
    expect(screen.queryByTestId('strip')).toBeNull();
    await act(async () => show(true));
    expect(screen.getByTestId('strip')).toBeOnTheScreen();
  });
});
