import {act, fireEvent, screen} from '@testing-library/react-native';
import {Text} from 'react-native';
import {router} from 'expo-router';
import {renderApp} from '../__tests__/router';
import {island} from '../__tests__/windows';
import {TabStack} from '../tab-stack';
import {Screen} from '../screen';
import {Stack} from './stack';

const app = (options: Record<string, unknown> = {}) => ({
  _layout: () => (
    <Stack screenOptions={options}>
      <Stack.Screen name="index" options={{title: 'Drops', headerRight: () => <Text testID="new">New…</Text>}}/>
    </Stack>
  ),
  index: () => <Screen><Text>Home screen</Text></Screen>,
  detail: () => (
    <>
      <Stack.Screen options={{headerTitle: 'A drop'}}/>
      <Text>Detail screen</Text>
    </>
  ),
  plain: () => <Text>Plain screen</Text>,
});

describe('Stack (windows)', () => {
  it('draws a header row with the screen title and trailing slot over the focused screen', async () => {
    await renderApp(app());
    expect(screen.getByText('Drops')).toBeOnTheScreen();
    expect(screen.getByTestId('new')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Go back')).toBeNull();
    expect(screen.getByText('Home screen')).toBeOnTheScreen();
  });

  it('pushes a screen with its own title and a back button, and pops from it', async () => {
    await renderApp(app());
    await act(async () => router.push('/detail'));
    expect(screen.getByText('A drop')).toBeOnTheScreen();
    expect(screen.getByText('Detail screen')).toBeOnTheScreen();
    expect(screen.queryByText('Home screen')).toBeNull();
    await fireEvent.press(screen.getByLabelText('Go back'));
    expect(screen.getByText('Drops')).toBeOnTheScreen();
    expect(screen.getByText('Home screen')).toBeOnTheScreen();
  });

  it('titles a screen without options after its route', async () => {
    await renderApp(app(), '/plain');
    expect(screen.getByText('plain')).toBeOnTheScreen();
    expect(screen.getByText('Plain screen')).toBeOnTheScreen();
  });

  it('hides the header on request', async () => {
    await renderApp(app({headerShown: false}));
    expect(screen.queryByText('Drops')).toBeNull();
    expect(screen.getByText('Home screen')).toBeOnTheScreen();
  });
});

describe('TabStack (windows)', () => {
  it('is the kit stack with the tab root titled and its trailing slot filled', async () => {
    await renderApp({
      _layout: () => <TabStack title="Documents" headerRight={() => <Text testID="menu">Menu</Text>}/>,
      index: () => <Screen><Text>Documents screen</Text></Screen>,
    });
    expect(screen.getByText('Documents')).toBeOnTheScreen();
    expect(screen.getByTestId('menu')).toBeOnTheScreen();
    expect(screen.getByText('Documents screen')).toBeOnTheScreen();
    expect(() => island('ExpoInterfaceNavigationView')).toThrow();
  });
});
