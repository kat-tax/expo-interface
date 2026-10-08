// Matchers are registered by expo-vitest's web setup; imported for the types.
import '@testing-library/jest-dom/vitest';
import type {TabRoute} from '../tabs/types';
import {useEffect, useState} from 'react';
import {Text} from 'react-native';
import {act, screen as dom} from '@testing-library/react';
import {router} from 'expo-router';
import {renderApp} from 'expo-vitest/router';
import {Screen} from '../screen';
import {TabStack} from '../tab-stack';
import {Tabs} from '../tabs';
import {HeaderAccessory} from '.';

/** Which row the screen renders, set from the test; `null` renders none. */
let show: (row: 'a' | 'b' | null) => void = () => {};

/** A screen's own rows, one of two or none, the way an app renders a row conditionally. */
function Rows() {
  const [row, setRow] = useState<'a' | 'b' | null>('a');
  useEffect(() => {
    show = next => setRow(next);
  });
  if (row === 'a') return <HeaderAccessory key="a"><Text testID="strip-a">Strip A</Text></HeaderAccessory>;
  if (row === 'b') return <HeaderAccessory key="b"><Text testID="strip-b">Strip B</Text></HeaderAccessory>;
  return null;
}

/** An app whose root screen renders the rows in its content, with a detail screen that has a row of its own. */
const app = {
  _layout: () => <TabStack title="Drops"/>,
  index: () => (
    <>
      <Rows/>
      <Text>Home screen</Text>
    </>
  ),
  detail: () => (
    <>
      <HeaderAccessory><Text testID="detail-strip">Detail strip</Text></HeaderAccessory>
      <Text>Detail screen</Text>
    </>
  ),
};

/** Whether `node` comes after `before` in the document. */
const follows = (before: Node, node: Node) => Boolean(before.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING);

describe('HeaderAccessory (web)', () => {
  it('puts the row in the header while it is rendered, and takes it away when it is not', async () => {
    await renderApp(app);
    const strip = dom.getByTestId('strip-a');
    // Under the title, in the header, before the content.
    expect(follows(dom.getByText('Drops'), strip)).toBe(true);
    expect(follows(strip, dom.getByText('Home screen'))).toBe(true);
    await act(async () => show(null));
    expect(dom.queryByTestId('strip-a')).toBeNull();
    // And back again.
    await act(async () => show('a'));
    expect(dom.getByTestId('strip-a')).toBeInTheDocument();
  });

  it('keeps the row that replaces another in the same render', async () => {
    await renderApp(app);
    // One element goes and another comes in one commit: the old one's
    // clear runs before the new one's set, so the new row stays.
    await act(async () => show('b'));
    expect(dom.queryByTestId('strip-a')).toBeNull();
    expect(dom.getByTestId('strip-b')).toBeInTheDocument();
  });

  it('takes the pill under a Tabs bar away when the screen stops rendering the row', async () => {
    const routes: TabRoute[] = [
      {href: '/home', name: 'home', label: 'Home', icon: {ios: 'house', android: 'home', web: 'home'}},
      {href: '/settings', name: 'settings', label: 'Settings', icon: {ios: 'gearshape', android: 'settings', web: 'settings'}},
    ];
    await renderApp({
      _layout: () => <Tabs routes={routes}/>,
      'home/_layout': () => <TabStack title="Drops"/>,
      'home/index': () => (
        <Screen>
          <Rows/>
          <Text>Home screen</Text>
        </Screen>
      ),
      settings: () => <Text>Settings screen</Text>,
    }, '/home');
    expect(dom.getByTestId('tab-bar-accessory').contains(dom.getByTestId('strip-a'))).toBe(true);
    await act(async () => show(null));
    expect(dom.queryByTestId('tab-bar-accessory')).toBeNull();
  });

  // Last: it moves the router, whose store outlives a render.
  it('sets nothing from a preloaded screen, and its row comes and goes with it once it is shown', async () => {
    await renderApp(app);
    await act(async () => router.prefetch('/detail'));
    expect(dom.queryByTestId('detail-strip')).toBeNull();
    await act(async () => router.push('/detail'));
    expect(dom.getByTestId('detail-strip')).toBeInTheDocument();
    await act(async () => router.back());
    expect(dom.queryByTestId('detail-strip')).toBeNull();
    expect(dom.getByTestId('strip-a')).toBeInTheDocument();
  });
});
