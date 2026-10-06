import type {ReactNode} from 'react';
import type {HeaderSearchCommands} from './types';
import {createRef} from 'react';
import {Platform, Text, View} from 'react-native';
import {act as actDom, fireEvent as fireDom, render as renderDom, screen as dom} from '@testing-library/react';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {barItems, searchBar} from '../__stories__/header';
import * as icons from '../__stories__/icons';
import {HeaderAction} from '../header-action';
import {HeaderActions} from '../header-actions';
import {InHeaderContext} from '../header/shared';
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

/**
 * jsdom lays nothing out, so react-native-web reads a window of no width,
 * which the header takes as a window it cannot measure and draws wide. A
 * narrow window is this: the document's width, and the resize that makes
 * `Dimensions` read it again.
 */
function windowWidth(width: number): () => void {
  const spy = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => width);
  window.dispatchEvent(new Event('resize'));
  return () => {
    spy.mockRestore();
    window.dispatchEvent(new Event('resize'));
  };
}

describe(`HeaderSearch (${Platform.OS})`, () => {
  if (Platform.OS === 'web') {

    it('sends a stacked search to a row under the header, in the header\'s own bar', async () => {
      const onChangeText = vi.fn();
      const onSubmit = vi.fn();
      const onOpen = vi.fn();
      const onClose = vi.fn();
      await renderApp(app(<HeaderSearch placement="stacked" placeholder="Find a drop" onChangeText={onChangeText} onSubmit={onSubmit} onOpen={onOpen} onClose={onClose} testID="q"/>));
      const input = dom.getByRole('searchbox', {name: 'Find a drop'});
      // Under the title, in the header, before the content.
      const title = dom.getByText('Drops');
      const content = dom.getByText('Home screen');
      expect(title.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(input.compareDocumentPosition(content) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      // Not in the title's row: the row under it.
      expect(title.parentElement!.contains(input)).toBe(false);
      expect(title.parentElement!.parentElement!.contains(input)).toBe(true);
      // The field holds its text, as a native search field does, and reports it.
      fireDom.change(input, {target: {value: 'dem'}});
      expect(onChangeText).toHaveBeenCalledWith('dem');
      expect(input).toHaveValue('dem');
      fireDom.keyDown(input, {key: 'Enter'});
      expect(onSubmit).toHaveBeenCalledWith('dem');
      // The focus coming and going is the search opening and closing.
      fireDom.focus(input);
      expect(onOpen).toHaveBeenCalledTimes(1);
      fireDom.blur(input);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('draws an inline search in the header row beside the title, which is what automatic is in a wide window', async () => {
      await renderApp(app(<HeaderSearch placeholder="Find a drop"/>));
      const input = dom.getByRole('searchbox', {name: 'Find a drop'});
      const title = dom.getByText('Drops');
      expect(title.parentElement!.contains(input)).toBe(true);
    });

    it('stacks an automatic search in a window too narrow for a field beside the title', async () => {
      const restore = windowWidth(390);
      try {
        await renderApp(app(<HeaderSearch placeholder="Find a drop"/>));
        const input = dom.getByRole('searchbox', {name: 'Find a drop'});
        expect(dom.getByText('Drops').parentElement!.contains(input)).toBe(false);
      } finally {
        restore();
      }
    });

    it('draws an action as a magnifier that expands into a field across the row, and collapses again', async () => {
      const onOpen = vi.fn();
      const onClose = vi.fn();
      const onBlur = vi.fn();
      await renderApp(app(<HeaderSearch placement="action" placeholder="Find a drop" onOpen={onOpen} onClose={onClose} onBlur={onBlur} testID="q"/>));
      expect(dom.queryByRole('searchbox')).toBeNull();
      const magnifier = dom.getByRole('button', {name: 'Find a drop'});
      expect(magnifier).toHaveAttribute('data-testid', 'q-open');
      expect(magnifier).toHaveClass('ui-button--icon-only', 'ui-button--label');
      fireDom.click(magnifier);
      expect(onOpen).toHaveBeenCalledTimes(1);
      const input = dom.getByRole('searchbox', {name: 'Find a drop'});
      // The field has the focus and the row: the title went.
      expect(document.activeElement).toBe(input);
      expect(dom.queryByText('Drops')).toBeNull();
      // Losing the focus with text in it keeps it open; Escape collapses it.
      fireDom.change(input, {target: {value: 'dem'}});
      fireDom.blur(input);
      expect(onBlur).toHaveBeenCalledTimes(1);
      expect(onClose).not.toHaveBeenCalled();
      fireDom.keyDown(input, {key: 'Escape'});
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(dom.queryByRole('searchbox')).toBeNull();
      expect(dom.getByText('Drops')).toBeInTheDocument();
      // Opened again, the field is empty, and a blur with nothing in it collapses it.
      fireDom.click(dom.getByRole('button', {name: 'Find a drop'}));
      const again = dom.getByRole('searchbox');
      expect(again).toHaveValue('');
      fireDom.blur(again);
      expect(onClose).toHaveBeenCalledTimes(2);
    });

    it('takes the commands through the ref: the text is set and cleared silently, cancel closes', async () => {
      const ref = createRef<HeaderSearchCommands>();
      const onChangeText = vi.fn();
      const onClose = vi.fn();
      await renderApp(app(<HeaderSearch ref={ref} placement="action" placeholder="Find a drop" onChangeText={onChangeText} onClose={onClose}/>));
      actDom(() => ref.current!.focus());
      const input = dom.getByRole('searchbox');
      expect(document.activeElement).toBe(input);
      actDom(() => ref.current!.setText('Demo'));
      expect(input).toHaveValue('Demo');
      expect(onChangeText).not.toHaveBeenCalled();
      actDom(() => ref.current!.blur());
      expect(document.activeElement).not.toBe(input);
      actDom(() => ref.current!.clear());
      expect(input).toHaveValue('');
      actDom(() => ref.current!.cancel());
      expect(dom.queryByRole('searchbox')).toBeNull();
      expect(onClose).toHaveBeenCalledTimes(1);
      // Cancelling a closed search changes nothing, and says nothing.
      actDom(() => ref.current!.cancel());
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('cancels a stacked search by emptying it and giving up the focus', async () => {
      const ref = createRef<HeaderSearchCommands>();
      await renderApp(app(<HeaderSearch ref={ref} placement="stacked"/>));
      const input = dom.getByRole('searchbox');
      actDom(() => ref.current!.focus());
      expect(document.activeElement).toBe(input);
      actDom(() => ref.current!.setText('Demo'));
      actDom(() => ref.current!.cancel());
      expect(input).toHaveValue('');
      expect(document.activeElement).not.toBe(input);
    });

    it('keeps a HeaderActions beside it, in the header\'s own slot', async () => {
      await renderApp(app(
        <>
          <HeaderSearch placement="inline" placeholder="Find a drop"/>
          <HeaderActions>
            <HeaderAction label="Copy" icon={icons.share} onPress={vi.fn()}/>
          </HeaderActions>
        </>,
      ));
      const row = dom.getByText('Drops').parentElement!;
      expect(row.contains(dom.getByRole('searchbox'))).toBe(true);
      expect(row.contains(dom.getByRole('button', {name: 'Copy'}))).toBe(true);
    });

    it('draws itself where it is inside a header already', () => {
      renderDom(
        <InHeaderContext.Provider value={true}>
          <HeaderSearch placeholder="Find a drop" testID="q"/>
        </InHeaderContext.Provider>,
      );
      expect(dom.getByRole('searchbox', {name: 'Find a drop'})).toHaveAttribute('data-testid', 'q');
    });

    it('draws an action where it is inside a header already, with no header to tell', () => {
      renderDom(
        <InHeaderContext.Provider value={true}>
          <HeaderSearch placement="action" placeholder="Find a drop"/>
        </InHeaderContext.Provider>,
      );
      fireDom.click(dom.getByRole('button', {name: 'Find a drop'}));
      expect(dom.getByRole('searchbox', {name: 'Find a drop'})).toBeInTheDocument();
    });

    it('focuses a stacked field on mount when asked', async () => {
      await renderApp(app(<HeaderSearch placement="stacked" autoFocus/>));
      expect(document.activeElement).toBe(dom.getByRole('searchbox'));
    });

    it('opens an action with the focus on mount when asked, and the header is told from the start', async () => {
      await renderApp(app(<HeaderSearch placement="action" autoFocus/>));
      expect(document.activeElement).toBe(dom.getByRole('searchbox'));
      // The row is the field's: the title went.
      expect(dom.queryByText('Drops')).toBeNull();
    });

    it('puts an integrated search in a bottom toolbar of the screen, with the fab above it', () => {
      renderDom(
        <SafeAreaProvider>
          <Screen fab={<Text testID="fab">New</Text>}>
            <HeaderSearch placement="integrated" placeholder="Find a drop" testID="q"/>
            <View testID="kid"/>
          </Screen>
        </SafeAreaProvider>,
      );
      const bar = dom.getByTestId('q-bar');
      const input = dom.getByRole('searchbox', {name: 'Find a drop'});
      expect(bar.contains(input)).toBe(true);
      // Below the content, in the screen's bars slot.
      const bars = dom.getByTestId('screen-bars');
      expect(bars.contains(bar)).toBe(true);
      expect(dom.getByTestId('kid').compareDocumentPosition(bar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('draws an integrated search over the bottom edge of what it is in, outside a screen', () => {
      renderDom(
        <View>
          <HeaderSearch placement="integrated" testID="q"/>
        </View>,
      );
      const bar = dom.getByTestId('q-bar');
      const slot = bar.parentElement!;
      expect(getComputedStyle(slot).position).toBe('absolute');
      expect(getComputedStyle(slot).bottom).toBe('0px');
    });
    return;
  }

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
    // Above the content, in the screen's root, not in its content box.
    const content = screen.getByTestId('kid').parent!;
    expect(content.parent!.children.indexOf(row)).toBeLessThan(content.parent!.children.indexOf(content));
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
