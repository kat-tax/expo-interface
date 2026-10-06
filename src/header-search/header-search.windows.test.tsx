import type {HeaderSearchCommands} from './types';
import {createRef} from 'react';
import {Text, View} from 'react-native';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {HeaderAction} from '../header-action';
import {HeaderActions} from '../header-actions';
import {InHeaderContext} from '../header/shared';
import {Stack} from '../router/stack';
import {Screen} from '../screen';
import {fireIsland, island, islands} from 'expo-vitest/windows';
import {renderApp} from 'expo-vitest/router';
import {HeaderSearch} from '.';

const BOX = 'ExpoInterfaceAutoSuggestBox';
const BUTTON = 'ExpoInterfaceButton';

/** An app whose root screen renders the search in its content, under the kit's stack. */
function app(control: React.ReactNode) {
  return {
    _layout: () => (
      <Stack screenOptions={{headerShown: true}}>
        <Stack.Screen name="index" options={{title: 'Drops'}}/>
      </Stack>
    ),
    index: () => (
      <>
        {control}
        <Text>Home screen</Text>
      </>
    ),
  };
}

describe('HeaderSearch (windows)', () => {
  it('sends a stacked search to a row under the header row, as an AutoSuggestBox', async () => {
    const onChangeText = vi.fn();
    const onSubmit = vi.fn();
    const onOpen = vi.fn();
    const onClose = vi.fn();
    await renderApp(app(<HeaderSearch placement="stacked" placeholder="Find a drop" onChangeText={onChangeText} onSubmit={onSubmit} onOpen={onOpen} onClose={onClose} testID="q"/>));
    expect(screen.getByText('Home screen')).toBeOnTheScreen();
    const box = island(BOX);
    expect(box.props).toMatchObject({placeholder: 'Find a drop', text: '', testID: 'q'});
    // Under the title's row, in the header.
    const title = screen.getByText('Drops');
    expect(title.parent!.parent!).toContainElement(box);
    expect(title.parent!).not.toContainElement(box);
    await fireIsland(box, 'textChange', {text: 'dem'});
    expect(onChangeText).toHaveBeenCalledWith('dem');
    expect(island(BOX).props.text).toBe('dem');
    await fireIsland(box, 'submit', {text: 'dem'});
    expect(onSubmit).toHaveBeenCalledWith('dem');
    await fireIsland(box, 'focusChange', {focused: true});
    expect(onOpen).toHaveBeenCalledTimes(1);
    await fireIsland(box, 'focusChange', {focused: false});
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('draws an automatic search inline, beside the title: a desktop window has the room', async () => {
    await renderApp(app(<HeaderSearch placeholder="Find a drop"/>));
    expect(screen.getByText('Drops').parent!).toContainElement(island(BOX));
  });

  it('draws an action as a magnifier that opens the box with the focus, and closes it on Escape or an empty blur', async () => {
    const onOpen = vi.fn();
    const onClose = vi.fn();
    await renderApp(app(<HeaderSearch placement="action" placeholder="Find a drop" onOpen={onOpen} onClose={onClose} testID="q"/>));
    expect(islands(BOX)).toHaveLength(0);
    const magnifier = island(BUTTON);
    expect(magnifier.props).toMatchObject({label: 'Find a drop', iconOnly: true, tone: 'label', glyph: 'E721'});
    await fireEvent(screen.getByTestId('q-open'), 'press');
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(island(BOX).props.autoFocus).toBe(true);
    // The row is the field's: the title went.
    expect(screen.queryByText('Drops')).toBeNull();
    await fireIsland(island(BOX), 'keyPress', {key: 'a', shiftKey: false});
    expect(onClose).not.toHaveBeenCalled();
    await fireIsland(island(BOX), 'keyPress', {key: 'Escape', shiftKey: false});
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(islands(BOX)).toHaveLength(0);
    expect(screen.getByText('Drops')).toBeOnTheScreen();
    await fireEvent(screen.getByTestId('q-open'), 'press');
    await fireIsland(island(BOX), 'focusChange', {focused: false});
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('takes the commands through the ref', async () => {
    const ref = createRef<HeaderSearchCommands>();
    const onChangeText = vi.fn();
    await renderApp(app(<HeaderSearch ref={ref} placement="action" onChangeText={onChangeText}/>));
    await act(async () => ref.current!.focus());
    expect(island(BOX).props.autoFocus).toBe(true);
    await act(async () => ref.current!.setText('Demo'));
    expect(island(BOX).props.text).toBe('Demo');
    expect(onChangeText).not.toHaveBeenCalled();
    await act(async () => ref.current!.blur());
    await act(async () => ref.current!.clear());
    expect(island(BOX).props.text).toBe('');
    await act(async () => ref.current!.cancel());
    expect(islands(BOX)).toHaveLength(0);
  });

  it('keeps a HeaderActions beside it in the header row', async () => {
    await renderApp(app(
      <>
        <HeaderSearch placement="inline"/>
        <HeaderActions>
          <HeaderAction label="Copy" onPress={vi.fn()} testID="copy"/>
        </HeaderActions>
      </>,
    ));
    const row = screen.getByText('Drops').parent!;
    expect(row).toContainElement(island(BOX));
    expect(row).toContainElement(screen.getByTestId('copy'));
  });

  it('draws itself where it is inside a header already', async () => {
    await render(
      <InHeaderContext.Provider value={true}>
        <HeaderSearch placeholder="Find a drop"/>
      </InHeaderContext.Provider>,
    );
    expect(island(BOX).props.placeholder).toBe('Find a drop');
  });

  it('puts an integrated search in a bottom toolbar of the screen, and over the bottom edge outside one', async () => {
    await render(
      <Screen fab={<Text>New</Text>}>
        <HeaderSearch placement="integrated" testID="q"/>
        <View testID="kid"/>
      </Screen>,
    );
    expect(screen.getByTestId('screen-bars')).toContainElement(screen.getByTestId('q-bar'));
    expect(screen.getByTestId('q-bar')).toContainElement(island(BOX));
    await render(
      <View>
        <HeaderSearch placement="integrated" testID="alone"/>
      </View>,
    );
    expect(screen.getByTestId('alone-bar').parent).toHaveStyle({position: 'absolute', bottom: 0});
  });
});
