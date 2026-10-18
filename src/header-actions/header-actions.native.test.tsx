import type {ReactNode} from 'react';
import type {MenuItem} from '../menu/types';
import {Platform, Text} from 'react-native';
import {screen} from '@testing-library/react-native';
import {barItems} from '../__stories__/header';
import * as icons from '../__stories__/icons';
import {InHeaderContext} from '../header/shared';
import {TabStack} from '../tab-stack';
import {nodes} from 'expo-vitest/native';
import {renderApp} from 'expo-vitest/router';
import {HeaderAction} from '../header-action';
import {HeaderMenu} from '../header-menu';
import {HeaderActions} from '.';

const HOST = 'ViewManagerAdapter_ExpoUI_HostView';
const items: MenuItem[] = [{label: 'PDF'}, {label: 'Markdown'}];

/** An app whose root screen renders the row in its content. */
function app(row: ReactNode) {
  return {
    _layout: () => <TabStack title="Drops"/>,
    index: () => (
      <>
        {row}
        <Text>Home screen</Text>
      </>
    ),
  };
}

const row = (
  <HeaderActions testID="actions">
    <HeaderAction label="Copy" icon={icons.share} onPress={vi.fn()} hideLabel/>
    <HeaderMenu label="Export" icon={icons.add} items={items} hideLabel/>
  </HeaderActions>
);

describe(`HeaderActions (${Platform.OS})`, () => {
  it('is the bar\'s own items, in the order given, and draws nothing in the screen', async () => {
    await renderApp(app(row));
    expect(screen.getByText('Home screen')).toBeOnTheScreen();
    expect(nodes().filter(n => n.type === HOST)).toHaveLength(0);
    const bar = barItems('Drops');
    expect(bar.map(item => [item.type, item.accessibilityLabel])).toEqual([['button', 'Copy'], ['menu', 'Export']]);
    expect(bar[1].menu.items.map((entry: {title: string}) => entry.title)).toEqual(['PDF', 'Markdown']);
  });

  it('reads the items off the elements it is given, through a fragment', async () => {
    await renderApp(app(
      <HeaderActions>
        <>
          <HeaderAction label="Copy" icon={icons.share} onPress={vi.fn()} hideLabel/>
          <HeaderAction label="Save" icon={icons.add} onPress={vi.fn()} hideLabel/>
        </>
      </HeaderActions>,
    ));
    expect(barItems('Drops').map(item => item.accessibilityLabel)).toEqual(['Copy', 'Save']);
  });

  it('puts any other element in the bar as a custom view, and leaves bare text out', async () => {
    await renderApp(app(
      <HeaderActions>
        <HeaderAction label="Copy" icon={icons.share} onPress={vi.fn()} hideLabel/>
        <Text>Draft</Text>
        Saved
      </HeaderActions>,
    ));
    const bar = barItems('Drops');
    expect(bar.map(item => item.type)).toEqual(['button', 'custom']);
    // The view is inside the bar, and says so: a kit control an app's
    // component renders there draws itself in the view instead of sending
    // itself to the header again, as a second toolbar inside the bar's own.
    const view = bar[1].children;
    expect(view.type).toBe(InHeaderContext.Provider);
    expect(view.props.value).toBe(true);
    expect(view.props.children.type).toBe(Text);
  });
});
