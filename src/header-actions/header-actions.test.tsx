import type {ReactNode} from 'react';
import type {MenuItem} from '../menu/types';
import {Platform, Text} from 'react-native';
import {fireEvent as fireDom, render as renderDom, screen as dom} from '@testing-library/react';
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

/** The row as a header draws it: inside the header's trailing slot. */
function inHeader(node: ReactNode) {
  return <InHeaderContext.Provider value={true}>{node}</InHeaderContext.Provider>;
}

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
  if (Platform.OS === 'web') {
    it('lays the actions out in a row with space between them', () => {
      renderDom(inHeader(row));
      const element = dom.getByTestId('actions');
      const style = getComputedStyle(element);
      expect(style.display).toBe('flex');
      expect(style.flexDirection).toBe('row');
      expect(style.alignItems).toBe('center');
      // An icon button in the bar is a 30px box around an 18px glyph, so two
      // of them abutting leave 12px between the glyphs and read as one.
      expect(style.gap).toBe('8px');
      expect(dom.getByRole('button', {name: 'Copy'})).toBeInTheDocument();
      expect(dom.getByRole('button', {name: 'Export'})).toBeInTheDocument();
    });

    it('keeps each action working', () => {
      const onPress = vi.fn();
      renderDom(inHeader(
        <HeaderActions>
          <HeaderAction label="Copy" onPress={onPress}/>
        </HeaderActions>,
      ));
      fireDom.click(dom.getByRole('button', {name: 'Copy'}));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('sends the whole row to the header from the screen it is rendered in', async () => {
      await renderApp(app(row));
      const element = dom.getByTestId('actions');
      const title = dom.getByText('Drops');
      const content = dom.getByText('Home screen');
      expect(title.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(element.compareDocumentPosition(content) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(dom.getByRole('button', {name: 'Copy'})).toHaveClass('ui-button--medium');
      expect(dom.getByRole('button', {name: 'Export'})).toHaveClass('ui-button--medium');
    });
    return;
  }

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
    expect(barItems('Drops').map(item => item.type)).toEqual(['button', 'custom']);
  });
});
