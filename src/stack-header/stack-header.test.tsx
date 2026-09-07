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


    it('hands its header to a bar slot and draws nothing itself', () => {
      const slot = createHeaderSlot();
      const goBack = vi.fn();
      const {container} = render(
        <SafeAreaProvider>
          <HeaderSlotContext.Provider value={slot}>
            <WebStackHeader
              navigation={{goBack}}
              route={{name: 'detail'}}
              back={{title: 'Drops'}}
              options={{title: 'Detail', headerRight: () => <Button label="Edit"/>}}
            />
          </HeaderSlotContext.Provider>
        </SafeAreaProvider>,
      );
      expect(container.textContent).toBe('');
      const header = slot.get()!;
      expect(header.title).toBe('Detail');
      expect(header.trailing).toBeTruthy();
      header.onBack!();
      expect(goBack).toHaveBeenCalledTimes(1);
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
