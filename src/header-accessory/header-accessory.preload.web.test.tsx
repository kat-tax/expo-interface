// Matchers are registered by expo-vitest's web setup; imported for the types.
import '@testing-library/jest-dom/vitest';
import {Text} from 'react-native';
import {act, screen as dom} from '@testing-library/react';
import {router} from 'expo-router';
import {renderApp} from 'expo-vitest/router';
import {TabStack} from '../tab-stack';
import {HeaderAccessory} from '.';

/**
 * A file of its own: the test moves the router, whose store outlives a
 * render, and a test after it in the same file would start from where it
 * left the router rather than from its own app.
 */
const app = {
  _layout: () => <TabStack title="Drops"/>,
  index: () => (
    <>
      <HeaderAccessory><Text testID="home-strip">Home strip</Text></HeaderAccessory>
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

describe('HeaderAccessory on a preloaded screen (web)', () => {
  it('sets nothing from a preloaded screen, and its row comes and goes with it once it is shown', async () => {
    await renderApp(app);
    await act(async () => router.prefetch('/detail'));
    expect(dom.queryByTestId('detail-strip')).toBeNull();
    await act(async () => router.push('/detail'));
    expect(dom.getByTestId('detail-strip')).toBeInTheDocument();
    await act(async () => router.back());
    expect(dom.queryByTestId('detail-strip')).toBeNull();
    expect(dom.getByTestId('home-strip')).toBeInTheDocument();
  });
});
