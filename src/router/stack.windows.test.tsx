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

describe('Stack modals (windows)', () => {
  const modalApp = () => ({
    _layout: () => (
      <Stack>
        <Stack.Screen name="index" options={{title: 'Drops'}}/>
        <Stack.Screen name="edit" options={{presentation: 'modal', title: 'Edit drop'}}/>
        <Stack.Screen name="picker" options={{presentation: 'transparentModal'}}/>
        <Stack.Screen name="quiet" options={{presentation: 'formSheet', headerShown: false}}/>
      </Stack>
    ),
    index: () => <Screen><Text>Home screen</Text></Screen>,
    edit: () => <Text>Edit form</Text>,
    picker: () => <Text>Picker over</Text>,
    quiet: () => <Text>Quiet form</Text>,
  });

  it('presents a modal route in a card over the screen below, with its own header, and dismisses it', async () => {
    await renderApp(modalApp());
    await act(async () => router.push('/edit'));
    expect(screen.getByText('Home screen')).toBeOnTheScreen();
    expect(screen.getByText('Edit form')).toBeOnTheScreen();
    expect(screen.getByText('Edit drop')).toBeOnTheScreen();
    expect(screen.getByTestId('modal-edit')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Dismiss'));
    expect(screen.queryByText('Edit form')).toBeNull();
    await act(async () => router.push('/edit'));
    await fireEvent(screen.getByTestId('windows-stack'), 'keyDown', {nativeEvent: {key: 'Escape'}});
    expect(screen.queryByText('Edit form')).toBeNull();
    await act(async () => router.push('/edit'));
    await fireEvent.press(screen.getAllByLabelText('Go back')[0]);
    expect(screen.queryByText('Edit form')).toBeNull();
    expect(screen.getByText('Home screen')).toBeOnTheScreen();
  });

  it('lays a transparent modal over the window, stacks a second modal, and hides a header on request', async () => {
    await renderApp(modalApp());
    await act(async () => router.push('/picker'));
    expect(screen.getByText('Picker over')).toBeOnTheScreen();
    expect(screen.getByTestId('modal-picker').queryAll(node => node.props.accessibilityLabel === 'Dismiss')).toHaveLength(0);
    await act(async () => router.push('/quiet'));
    expect(screen.getByText('Picker over')).toBeOnTheScreen();
    expect(screen.getByText('Quiet form')).toBeOnTheScreen();
    expect(screen.queryByText('quiet')).toBeNull();
    // Only the topmost modal dismisses; the smoke belongs to it.
    await fireEvent.press(screen.getByLabelText('Dismiss'));
    expect(screen.queryByText('Quiet form')).toBeNull();
    expect(screen.getByText('Picker over')).toBeOnTheScreen();
  });

  it('pops on Alt+Left, the keyboard back keys and the mouse back button, and never at the root', async () => {
    await renderApp(app());
    const root = screen.getByTestId('windows-stack');
    await fireEvent(root, 'keyDown', {nativeEvent: {key: 'ArrowLeft', altKey: true}});
    expect(screen.getByText('Home screen')).toBeOnTheScreen();
    await act(async () => router.push('/detail'));
    await fireEvent(root, 'keyDown', {nativeEvent: {key: 'ArrowLeft', altKey: false}});
    expect(screen.getByText('Detail screen')).toBeOnTheScreen();
    await fireEvent(root, 'keyDown', {nativeEvent: {key: 'ArrowLeft', altKey: true}});
    expect(screen.getByText('Home screen')).toBeOnTheScreen();
    await act(async () => router.push('/detail'));
    await fireEvent(root, 'keyDown', {nativeEvent: {key: 'BrowserBack', altKey: false}});
    expect(screen.getByText('Home screen')).toBeOnTheScreen();
    await act(async () => router.push('/detail'));
    await fireEvent(root, 'pointerDown', {nativeEvent: {button: 0}});
    expect(screen.getByText('Detail screen')).toBeOnTheScreen();
    await fireEvent(root, 'pointerDown', {nativeEvent: {button: 3}});
    expect(screen.getByText('Home screen')).toBeOnTheScreen();
    await fireEvent(root, 'pointerDown', {nativeEvent: {button: 3}});
    expect(screen.getByText('Home screen')).toBeOnTheScreen();
  });
});
