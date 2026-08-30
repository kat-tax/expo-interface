import {Platform, Text} from 'react-native';
import {act, fireEvent, screen as dom} from '@testing-library/react';
import {screen} from '@testing-library/react-native';
import {Stack, router} from 'expo-router';
import {Button} from '../button';
import {bound} from '../theme';
import {host} from '../../jest/native';
import {renderApp} from '../__tests__/router';
import {ConstrainedStackHeader} from '.';

const app = {
  _layout: () => (
    <Stack screenOptions={{headerShown: true, header: ConstrainedStackHeader}}>
      <Stack.Screen name="index" options={{title: 'Drops'}}/>
      <Stack.Screen
        name="detail"
        options={{title: 'Detail', headerRight: () => <Button label="Edit"/>}}
      />
    </Stack>
  ),
  index: () => <Text>Home screen</Text>,
  detail: () => <Text>Detail screen</Text>,
};

describe(`ConstrainedStackHeader (${Platform.OS})`, () => {
  if (Platform.OS === 'web') {
    it('renders the screen title in a row constrained to the content width', async () => {
      await renderApp(app);
      const title = dom.getByText('Drops');
      expect(getComputedStyle(title.parentElement!).maxWidth).toBe(`${bound.contentMaxWidth}px`);
      expect(dom.queryByLabelText('Go back')).toBeNull();
      expect(dom.getByText('Home screen')).toBeInTheDocument();
    });

    it('adds the back button and headerRight slot on pushed screens', async () => {
      await renderApp(app);
      act(() => router.push('/detail'));
      expect(dom.getByText('Detail')).toBeInTheDocument();
      expect(dom.getByRole('button', {name: 'Edit'})).toBeInTheDocument();

      fireEvent.click(dom.getByLabelText('Go back'));
      expect(dom.queryByText('Detail')).toBeNull();
      expect(dom.getByText('Home screen')).toBeInTheDocument();
    });
  } else {
    it('renders nothing, leaving the native header to the stack options', async () => {
      expect(ConstrainedStackHeader()).toBeNull();
      await renderApp(app);
      // A custom `header` hides the native bar; ours draws nothing in its place.
      expect(host(p => p.title === 'Drops').props.hidden).toBe(true);
      expect(screen.queryByText('Drops')).toBeNull();
      expect(screen.getByText('Home screen')).toBeOnTheScreen();
    });
  }
});
