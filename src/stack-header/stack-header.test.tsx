import {Platform, Text} from 'react-native';
import {act, fireEvent, render, screen as dom} from '@testing-library/react';
import {screen} from '@testing-library/react-native';
import {Stack, router} from 'expo-router';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Button} from '../button';
import {bound} from '../theme';
import {stackHeaders} from '../__tests__/native';
import {renderApp} from '../__tests__/router';
import {HeaderSlotContext, createHeaderSlot} from '../tabs/context';
import {ConstrainedStackHeader} from '.';
import {ConstrainedStackHeader as WebStackHeader} from './index.web';

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


    it('hands its header to a bar slot and draws nothing itself', async () => {
      const slot = createHeaderSlot();
      // The header publishes only while its screen is the focused one, so it
      // needs the navigator it always has in place of a bare render.
      await renderApp({
        ...app,
        _layout: () => (
          <HeaderSlotContext.Provider value={slot}>
            <Stack screenOptions={{headerShown: true, header: ConstrainedStackHeader}}>
              <Stack.Screen name="index" options={{title: 'Drops', headerRight: () => <Button label="New"/>}}/>
              <Stack.Screen
                name="detail"
                options={{title: 'Detail', headerRight: () => <Button label="Edit"/>}}
              />
            </Stack>
          </HeaderSlotContext.Provider>
        ),
      });

      // A tab's own screen hands over its trailing slot and keeps its title.
      expect(dom.queryByText('Drops')).toBeNull();
      expect(slot.get()!.title).toBeUndefined();
      expect(slot.get()!.trailing).toBeTruthy();

      // A pushed screen hands over all three, and still draws none of them.
      act(() => router.push('/detail'));
      expect(dom.queryByText('Detail')).toBeNull();
      expect(dom.getByText('Detail screen')).toBeInTheDocument();
      const header = slot.get()!;
      expect(header.title).toBe('Detail');
      expect(header.trailing).toBeTruthy();

      act(() => header.onBack!());
      expect(dom.getByText('Home screen')).toBeInTheDocument();
      expect(slot.get()!.title).toBeUndefined();
    });

    it('prefers a string headerTitle and falls back to the route name', () => {
      const goBack = vi.fn();
      const {rerender} = render(
        <SafeAreaProvider>
          <WebStackHeader
            navigation={{goBack}}
            route={{name: 'detail'}}
            back={{title: 'Home'}}
            options={{title: 'Ignored', headerTitle: 'Custom'}}
          />
        </SafeAreaProvider>,
      );
      expect(dom.getByText('Custom')).toBeInTheDocument();
      expect(dom.queryByText('Ignored')).toBeNull();
      fireEvent.click(dom.getByLabelText('Go back'));
      expect(goBack).toHaveBeenCalledTimes(1);

      rerender(
        <SafeAreaProvider>
          <WebStackHeader navigation={{goBack}} route={{name: 'detail'}} options={{}}/>
        </SafeAreaProvider>,
      );
      expect(dom.getByText('detail')).toBeInTheDocument();
      expect(dom.queryByLabelText('Go back')).toBeNull();
    });  } else {
    it('renders nothing, leaving the native header to the stack options', async () => {
      expect(ConstrainedStackHeader()).toBeNull();
      await renderApp(app);
      // A custom `header` hides the native bar; ours draws nothing in its place.
      const [header] = stackHeaders();
      expect(header.hidden).toBe(true);
      expect(screen.queryByText('Drops')).toBeNull();
      expect(screen.getByText('Home screen')).toBeOnTheScreen();
    });
  }
});
