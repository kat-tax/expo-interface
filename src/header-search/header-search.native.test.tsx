import type {ReactNode} from 'react';
import type {HeaderSearchCommands} from './types';
import {createRef} from 'react';
import {Platform, Text, View} from 'react-native';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {router} from 'expo-router';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {barItems, searchBar} from '../__stories__/header';
import * as icons from '../__stories__/icons';
import {HeaderAction} from '../header-action';
import {HeaderActions} from '../header-actions';
import {Screen} from '../screen';
import {TabStack} from '../tab-stack';
import {colors} from '../theme';
import {nodes} from 'expo-vitest/native';
import {renderApp} from 'expo-vitest/router';
import {HeaderSearch} from '.';

const HOST = 'ViewManagerAdapter_ExpoUI_HostView';

/** An app whose root screen renders the search in its content. */
function app(control: ReactNode) {
  return {
    _layout: () => <TabStack title="Drops"/>,
    index: () => (
      <>
        {control}
        <Text>Home screen</Text>
      </>
    ),
  };
}

describe(`HeaderSearch (${Platform.OS})`, () => {
  const isIOS = Platform.OS === 'ios';

  it('is the bar\'s own search: react-native-screens\' search bar, with the palette\'s colors and the events', async () => {
    const onChangeText = vi.fn();
    const onSubmit = vi.fn();
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    const onOpen = vi.fn();
    const onClose = vi.fn();
    await renderApp(app(
      <HeaderSearch placeholder="Find a drop" autoCapitalize="none" inputType="email" onChangeText={onChangeText} onSubmit={onSubmit} onFocus={onFocus} onBlur={onBlur} onOpen={onOpen} onClose={onClose}/>,
    ));
    expect(screen.getByText('Home screen')).toBeOnTheScreen();
    // No host of the kit's own: the search is the platform's.
    expect(nodes().filter(n => n.type === HOST)).toHaveLength(0);
    const bar = searchBar('Drops')!;
    expect(bar).toMatchObject({
      placeholder: 'Find a drop',
      autoCapitalize: 'none',
      inputType: 'email',
      placement: 'automatic',
      allowToolbarIntegration: true,
      tintColor: colors.light.tint,
      textColor: colors.light.label,
      hintTextColor: colors.light.tertiaryLabel,
      headerIconColor: colors.light.label,
    });
    expect(bar.autoFocus).toBeFalsy();
    await act(async () => bar.onChangeText({nativeEvent: {text: 'dem'}}));
    expect(onChangeText).toHaveBeenCalledWith('dem');
    await act(async () => bar.onSearchButtonPress({nativeEvent: {text: 'demo'}}));
    expect(onSubmit).toHaveBeenCalledWith('demo');
    await act(async () => bar.onFocus());
    expect(onFocus).toHaveBeenCalledTimes(1);
    await act(async () => bar.onBlur());
    expect(onBlur).toHaveBeenCalledTimes(1);
    if (isIOS) {
      // iOS's controller is open while its field has the focus.
      expect(onOpen).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    } else {
      // Android's search view says when it opens and closes.
      expect(onOpen).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
      await act(async () => bar.onOpen());
      await act(async () => bar.onClose());
      expect(onOpen).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  });

  it('lets go of the focus when a screen is pushed over its own, so the keyboard does not stay up over that one', async () => {
    await renderApp({
      _layout: () => <TabStack title="Drops"/>,
      index: () => <HeaderSearch/>,
      result: () => <Text>Result</Text>,
    });
    const bar = searchBar('Drops')!;
    const commands = {focus: vi.fn(), blur: vi.fn(), setText: vi.fn(), clearText: vi.fn(), cancelSearch: vi.fn(), toggleCancelButton: vi.fn()};
    bar.ref.current = commands;
    expect(commands.blur).not.toHaveBeenCalled();
    await act(async () => router.push('/result'));
    expect(screen.getByText('Result')).toBeOnTheScreen();
    expect(commands.blur).toHaveBeenCalledTimes(1);
  });

  it('survives the events without handlers', async () => {
    await renderApp(app(<HeaderSearch/>));
    const bar = searchBar('Drops')!;
    await act(async () => {
      bar.onChangeText({nativeEvent: {text: 'a'}});
      bar.onSearchButtonPress({nativeEvent: {text: 'a'}});
      bar.onFocus();
      bar.onBlur();
      bar.onOpen?.();
      bar.onClose();
    });
    expect(bar.placeholder).toBeUndefined();
  });

  it('forwards the commands to the native search bar', async () => {
    const ref = createRef<HeaderSearchCommands>();
    await renderApp(app(<HeaderSearch ref={ref}/>));
    const bar = searchBar('Drops')!;
    // The header config holds the bar as an element, so its ref is never set: the commands go nowhere.
    expect(() => {
      ref.current!.focus();
      ref.current!.blur();
      ref.current!.setText('a');
      ref.current!.clear();
      ref.current!.cancel();
    }).not.toThrow();
    const commands = {focus: vi.fn(), blur: vi.fn(), setText: vi.fn(), clearText: vi.fn(), cancelSearch: vi.fn(), toggleCancelButton: vi.fn()};
    bar.ref.current = commands;
    ref.current!.focus();
    ref.current!.blur();
    ref.current!.setText('Demo');
    ref.current!.clear();
    ref.current!.cancel();
    expect(commands.focus).toHaveBeenCalledTimes(1);
    expect(commands.blur).toHaveBeenCalledTimes(1);
    expect(commands.setText).toHaveBeenCalledWith('Demo');
    expect(commands.clearText).toHaveBeenCalledTimes(1);
    expect(commands.cancelSearch).toHaveBeenCalledTimes(1);
  });

  it('goes beside a HeaderActions rendered with it, and beside the items of one it is inside', async () => {
    await renderApp(app(
      <HeaderActions>
        <HeaderAction label="Copy" icon={icons.share} onPress={vi.fn()} hideLabel/>
        <HeaderSearch placeholder="Find a drop"/>
      </HeaderActions>,
    ));
    expect(barItems('Drops').map(item => item.accessibilityLabel)).toEqual(['Copy']);
    expect(searchBar('Drops')!.placeholder).toBe('Find a drop');
  });

  it('asks a placeholder function for the full text, which is all the native search shows', async () => {
    await renderApp(app(<HeaderSearch placeholder={state => (state.size === 'short' ? 'Find' : 'Find a drop')}/>));
    expect(searchBar('Drops')!.placeholder).toBe('Find a drop');
  });

  if (isIOS) {
    it('places the search as asked, in UIKit\'s words', async () => {
      await renderApp(app(<HeaderSearch placement="integrated" integration="button" hideWhenScrolling={false}/>));
      expect(searchBar('Drops')).toMatchObject({placement: 'integratedButton', allowToolbarIntegration: true, hideWhenScrolling: false});
    });

    it('makes an action the bar\'s own search button, kept out of the toolbar', async () => {
      await renderApp(app(<HeaderSearch placement="action"/>));
      expect(searchBar('Drops')).toMatchObject({placement: 'integratedButton', allowToolbarIntegration: false});
    });

    it('leaves stacked and inline to the controller', async () => {
      await renderApp(app(<HeaderSearch placement="stacked" autoFocus/>));
      expect(searchBar('Drops')).toMatchObject({placement: 'stacked', autoFocus: true});
      await renderApp(app(<HeaderSearch placement="inline"/>));
      expect(searchBar('Drops')!.placement).toBe('inline');
    });
    return;
  }

  it('is the toolbar\'s search view for an action, the placement words left to iOS', async () => {
    await renderApp(app(<HeaderSearch placement="action"/>));
    expect(searchBar('Drops')).toMatchObject({placement: 'integratedButton', allowToolbarIntegration: false});
    expect(searchBar('Drops')!.autoFocus).toBeFalsy();
  });

  it('opens an inline search from the start and keeps it open', async () => {
    const ref = createRef<HeaderSearchCommands>();
    const onClose = vi.fn();
    await renderApp(app(<HeaderSearch ref={ref} placement="inline" onClose={onClose}/>));
    const bar = searchBar('Drops')!;
    expect(bar.autoFocus).toBe(true);
    const commands = {focus: vi.fn()};
    bar.ref.current = commands;
    await act(async () => bar.onClose());
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(commands.focus).toHaveBeenCalledTimes(1);
  });

  it('draws a stacked search as a row under the app bar, the screen\'s own when it is inside one', async () => {
    const onChangeText = vi.fn();
    await render(
      <SafeAreaProvider>
        <Screen>
          <HeaderSearch placement="stacked" placeholder="Find a drop" onChangeText={onChangeText} testID="q"/>
          <Text testID="kid">Content</Text>
        </Screen>
      </SafeAreaProvider>,
    );
    const row = screen.getByTestId('q-stacked');
    expect(row).toHaveStyle({borderBottomWidth: expect.any(Number), borderRadius: 0});
    // Above the content, in the screen's top rows, not in its content box.
    const content = screen.getByTestId('kid').parent!;
    const rows = screen.getByTestId('screen-top-rows');
    expect(rows).toContainElement(row);
    expect(content).not.toContainElement(row);
    expect(content.parent!.children.indexOf(rows)).toBe(0);
    expect(content.parent!.children.indexOf(content)).toBe(1);
    const input = screen.getByPlaceholderText('Find a drop');
    await fireEvent.changeText(input, 'dem');
    expect(onChangeText).toHaveBeenCalledWith('dem');
    expect(input.props.value).toBe('dem');
  });

  it('draws an integrated search as a bottom toolbar of the screen, and over the bottom edge outside one', async () => {
    await render(
      <SafeAreaProvider>
        <Screen fab={<Text>New</Text>}>
          <HeaderSearch placement="integrated" testID="q"/>
          <Text>Content</Text>
        </Screen>
      </SafeAreaProvider>,
    );
    expect(screen.getByTestId('screen-bars')).toContainElement(screen.getByTestId('q-bar'));
    // The rows draw without a testID too, which is the usual case.
    await render(
      <SafeAreaProvider>
        <Screen>
          <HeaderSearch placement="stacked" placeholder="Above"/>
          <HeaderSearch placement="integrated" placeholder="Below"/>
        </Screen>
      </SafeAreaProvider>,
    );
    expect(screen.getByPlaceholderText('Above')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('Below')).toBeOnTheScreen();
    await render(
      <View>
        <HeaderSearch placement="integrated" testID="alone"/>
      </View>,
    );
    expect(screen.getByTestId('alone-bar').parent).toHaveStyle({position: 'absolute', bottom: 0});
  });
});
