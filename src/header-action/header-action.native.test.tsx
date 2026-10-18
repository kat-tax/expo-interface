import type {ReactNode} from 'react';
import {Platform, Text} from 'react-native';
import {act, screen} from '@testing-library/react-native';
import {barItems} from '../__stories__/header';
import * as icons from '../__stories__/icons';
import {TabStack} from '../tab-stack';
import {nodes} from 'expo-vitest/native';
import {renderApp} from 'expo-vitest/router';
import {HeaderAction} from '.';

const HOST = 'ViewManagerAdapter_ExpoUI_HostView';

/** An app whose root screen renders the control in its content. */
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

describe(`HeaderAction (${Platform.OS})`, () => {
  const isIOS = Platform.OS === 'ios';

  it('is the bar\'s own item: the symbol or drawable, named by the label, in the accent', async () => {
    const onPress = vi.fn();
    await renderApp(app(<HeaderAction label="Copy" icon={icons.share} onPress={onPress} hideLabel/>));
    expect(screen.getByText('Home screen')).toBeOnTheScreen();
    // No host of the kit's own: the item is the platform's.
    expect(nodes().filter(n => n.type === HOST)).toHaveLength(0);
    const [item] = barItems('Drops');
    expect(item).toMatchObject({
      type: 'button',
      accessibilityLabel: 'Copy',
      icon: isIOS ? {type: 'sfSymbol', name: 'square.and.arrow.up'} : icons.share.drawable,
      tintColor: '#007AFF',
    });
    expect(item.title).toBeFalsy();
    await act(async () => item.onPress());
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('takes the label tone and disables', async () => {
    await renderApp(app(<HeaderAction label="Copy" icon={icons.share} onPress={vi.fn()} hideLabel tone="label" disabled/>));
    expect(barItems('Drops')[0]).toMatchObject({tintColor: '#000000', disabled: true});
  });

  it('is the last lone control rendered: each sends itself, and the bar takes one', async () => {
    await renderApp(app(
      <>
        <HeaderAction label="Copy" icon={icons.share} onPress={vi.fn()} hideLabel/>
        <HeaderAction label="Save" icon={icons.add} onPress={vi.fn()} hideLabel/>
      </>,
    ));
    expect(barItems('Drops').map(item => item.accessibilityLabel)).toEqual(['Save']);
  });

  if (isIOS) {
    it('shows the label as the item\'s title when the label is not hidden, or there is no symbol', async () => {
      await renderApp(app(<HeaderAction label="Copy" icon={icons.share} onPress={vi.fn()}/>));
      const [item] = barItems('Drops');
      expect(item.title).toBe('Copy');
      expect(item.icon).toBeUndefined();
    });
  } else {
    it('draws the icon whenever there is a drawable, since the app bar\'s actions are icons', async () => {
      await renderApp(app(<HeaderAction label="Copy" icon={icons.share} onPress={vi.fn()}/>));
      expect(barItems('Drops')[0]).toMatchObject({type: 'button', icon: icons.share.drawable, accessibilityLabel: 'Copy'});
    });

    it('draws a text action as the kit\'s own button in a host, since the app bar has no text item', async () => {
      await renderApp(app(<HeaderAction label="Save" onPress={vi.fn()}/>));
      const [item] = barItems('Drops');
      expect(item.type).toBe('custom');
      // The bar's custom view holds the kit's host and button; the test
      // renderer keeps the bar's items as elements, so neither is mounted.
      expect(nodes().filter(n => n.type === HOST)).toHaveLength(0);
    });
  }
});
