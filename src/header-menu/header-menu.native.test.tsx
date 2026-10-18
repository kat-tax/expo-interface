import type {ReactNode} from 'react';
import type {IconToken} from '../icons';
import type {MenuItem} from '../menu/types';
import {Platform, Text} from 'react-native';
import {act, screen} from '@testing-library/react-native';
import {barItems} from '../__stories__/header';
import * as icons from '../__stories__/icons';
import {iosSymbol} from '../button/shared';
import {TabStack} from '../tab-stack';
import {nodes} from 'expo-vitest/native';
import {renderApp} from 'expo-vitest/router';
import {HeaderMenu} from '.';

const HOST = 'ViewManagerAdapter_ExpoUI_HostView';
const items: MenuItem[] = [
  {label: 'Blank document', icon: icons.add},
  {label: 'Import files…', icon: icons.share},
];

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

describe(`HeaderMenu (${Platform.OS})`, () => {
  const isIOS = Platform.OS === 'ios';
  const icon = (token: IconToken) => isIOS ? {type: 'sfSymbol', name: iosSymbol(token)} : token.drawable;

  it('is the bar\'s own menu: the trigger an item in the accent, the entries its menu', async () => {
    const onBlank = vi.fn();
    const entries: MenuItem[] = [
      {label: 'Blank document', icon: icons.add, onPress: onBlank},
      {label: 'Import files…', icon: icons.share, active: true},
      {label: 'Delete', role: 'destructive', separator: true, disabled: true},
    ];
    await renderApp(app(<HeaderMenu label="New…" icon={icons.add} items={entries} hideLabel/>));
    expect(screen.getByText('Home screen')).toBeOnTheScreen();
    // No host of the kit's own: the menu is the platform's.
    expect(nodes().filter(n => n.type === HOST)).toHaveLength(0);
    const [item] = barItems('Drops');
    expect(item).toMatchObject({type: 'menu', accessibilityLabel: 'New…', icon: icon(icons.add), tintColor: '#007AFF'});
    expect(item.title).toBeFalsy();
    const [blank, imports, group] = item.menu.items;
    expect(blank).toMatchObject({type: 'action', title: 'Blank document', icon: icon(icons.add), state: 'off', destructive: false});
    // An active entry is on; a separator starts an inline group, with the
    // destructive entry in the danger color and disabled.
    expect(imports).toMatchObject({type: 'action', title: 'Import files…', state: 'on'});
    expect(group).toMatchObject({type: 'submenu', displayInline: true});
    expect(group.items).toHaveLength(1);
    expect(group.items[0]).toMatchObject({type: 'action', title: 'Delete', destructive: true, disabled: true, state: 'off'});
    await act(async () => blank.onPress());
    expect(onBlank).toHaveBeenCalledTimes(1);
  });

  it('takes the label tone and disables', async () => {
    await renderApp(app(<HeaderMenu label="New…" icon={icons.add} items={items} hideLabel tone="label" disabled/>));
    expect(barItems('Drops')[0]).toMatchObject({type: 'menu', tintColor: '#000000', disabled: true});
  });

  if (isIOS) {
    it('shows the label as the item\'s title when the label is not hidden, or there is no symbol', async () => {
      await renderApp(app(<HeaderMenu label="New…" icon={icons.add} items={items}/>));
      const [item] = barItems('Drops');
      expect(item).toMatchObject({type: 'menu', title: 'New…'});
      expect(item.icon).toBeUndefined();
      expect(item.menu.items.map((entry: {title: string}) => entry.title)).toEqual(['Blank document', 'Import files…']);
    });
  } else {
    it('draws the icon whenever there is a drawable, since the app bar\'s actions are icons', async () => {
      await renderApp(app(<HeaderMenu label="New…" icon={icons.add} items={items}/>));
      expect(barItems('Drops')[0]).toMatchObject({type: 'menu', icon: icons.add.drawable, accessibilityLabel: 'New…'});
    });

    it('draws a text menu as the kit\'s own menu in a host, since the app bar has no text item', async () => {
      await renderApp(app(<HeaderMenu label="New…" items={items}/>));
      expect(barItems('Drops')[0].type).toBe('custom');
    });
  }
});
