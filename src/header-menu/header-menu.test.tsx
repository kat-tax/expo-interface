import type {ReactNode} from 'react';
import type {IconToken} from '../icons';
import type {MenuItem} from '../menu/types';
import {Platform, Text} from 'react-native';
import {render as renderDom, screen as dom} from '@testing-library/react';
import {act, screen} from '@testing-library/react-native';
import {barItems} from '../__stories__/header';
import * as icons from '../__stories__/icons';
import {iosSymbol} from '../button/shared';
import {InHeaderContext} from '../header/shared';
import {TabStack} from '../tab-stack';
import {InBarContext, NarrowBarContext} from '../tabs/context';
import {nodes} from 'expo-vitest/native';
import {renderApp} from 'expo-vitest/router';
import {HeaderMenu} from '.';

const HOST = 'ViewManagerAdapter_ExpoUI_HostView';
const items: MenuItem[] = [
  {label: 'Blank document', icon: icons.add},
  {label: 'Import files…', icon: icons.share},
];

/** The control as a header draws it: inside the header's trailing slot. */
function inHeader(node: ReactNode) {
  return <InHeaderContext.Provider value={true}>{node}</InHeaderContext.Provider>;
}

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
  if (Platform.OS === 'web') {
    it('renders the plain header-sized text menu trigger for a custom header', () => {
      renderDom(inHeader(<HeaderMenu label="New…" icon={icons.add} items={items} testID="new"/>));
      const trigger = dom.getByRole('button', {name: 'New…'});
      expect(trigger).toHaveClass('ui-button--text', 'ui-button--medium');
      expect(trigger).toHaveAttribute('data-testid', 'new');
      expect(dom.getAllByRole('menuitem', {hidden: true})
        .map(e => e.querySelector('.ui-menu__label')?.textContent))
        .toEqual(['Blank document', 'Import files…']);
      expect(document.querySelector('[style*="--expo-ui-primary-500"]')).toBeNull();
    });

    it('drops to the bar size when it is folded into the web tab bar', () => {
      renderDom(
        <InBarContext.Provider value={true}>
          <HeaderMenu label="New…" icon={icons.add} items={items}/>
        </InBarContext.Provider>,
      );
      const trigger = dom.getByRole('button', {name: 'New…'});
      // The bar is the height of its tabs; a header-sized button would grow it.
      expect(trigger).toHaveClass('ui-button--small');
      expect(trigger).not.toHaveClass('ui-button--medium');
    });

    it('shows the icon alone in a bar too narrow for labels, unless it has none', () => {
      renderDom(
        <InBarContext.Provider value={true}>
          <NarrowBarContext.Provider value={true}>
            <HeaderMenu label="New…" icon={icons.add} items={items}/>
            <HeaderMenu label="Edit" items={items}/>
          </NarrowBarContext.Provider>
        </InBarContext.Provider>,
      );
      // The label stays the accessible name.
      expect(dom.getByRole('button', {name: 'New…'})).toHaveClass('ui-button--icon-only');
      expect(dom.getByRole('button', {name: 'Edit'})).not.toHaveClass('ui-button--icon-only');
    });

    it('takes the label tone, hides the label and disables', () => {
      renderDom(inHeader(<HeaderMenu label="New" icon={icons.add} items={items} tone="label" hideLabel disabled/>));
      const trigger = dom.getByRole('button', {name: 'New'});
      expect(trigger).toHaveClass('ui-button--label', 'ui-button--icon-only');
      expect((trigger as HTMLButtonElement).disabled).toBe(true);
    });

    it('sends itself to the header from the screen it is rendered in', async () => {
      await renderApp(app(<HeaderMenu label="New…" icon={icons.add} items={items} testID="new"/>));
      const trigger = dom.getByRole('button', {name: 'New…'});
      // In the header row, after the title and before the screen's content.
      const title = dom.getByText('Drops');
      const content = dom.getByText('Home screen');
      expect(title.compareDocumentPosition(trigger) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(trigger.compareDocumentPosition(content) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(trigger).toHaveClass('ui-button--medium');
      expect(dom.getAllByRole('menuitem', {hidden: true})).toHaveLength(2);
    });
    return;
  }

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
