import {Platform, StyleSheet, Text, View} from 'react-native';
import {render as renderDom, screen as dom} from '@testing-library/react';
import {fireEvent, render, screen} from '@testing-library/react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {spacing} from '../theme';
import {ScreenBar} from './bars';
import {Screen} from '.';

/** A control deep in the content that gives the screen a bar. */
function Control({edge, label}: {edge: 'top' | 'bottom'; label: string}) {
  return (
    <View>
      <ScreenBar edge={edge}><Text testID={`bar-${label}`}>{label}</Text></ScreenBar>
    </View>
  );
}

describe(`Screen bars (${Platform.OS})`, () => {
  if (Platform.OS === 'web') {
    it('draws a top bar above the content and a bottom bar below it, wherever the control is', () => {
      renderDom(
        <SafeAreaProvider>
          <Screen>
            <View testID="kid">
              <Control edge="bottom" label="bottom"/>
              <Control edge="top" label="top"/>
            </View>
          </Screen>
        </SafeAreaProvider>,
      );
      const kid = dom.getByTestId('kid');
      const top = dom.getByTestId('bar-top');
      const bottom = dom.getByTestId('bar-bottom');
      // Neither is where its control is.
      expect(kid.contains(top)).toBe(false);
      expect(kid.contains(bottom)).toBe(false);
      expect(top.compareDocumentPosition(kid) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(kid.compareDocumentPosition(bottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      // The top rows are the screen's width, with no gap between them and the content.
      const rows = dom.getByTestId('screen-top-rows');
      expect(rows.contains(top)).toBe(true);
      expect(getComputedStyle(rows).alignSelf).toBe('stretch');
      expect(getComputedStyle(rows.parentElement!).gap).toBe('');
      expect(dom.getByTestId('screen-bars').contains(bottom)).toBe(true);
    });

    it('takes a bar away with its control', () => {
      const {rerender} = renderDom(
        <SafeAreaProvider>
          <Screen>
            <Control edge="bottom" label="bottom"/>
          </Screen>
        </SafeAreaProvider>,
      );
      expect(dom.getByTestId('screen-bars')).toBeInTheDocument();
      rerender(
        <SafeAreaProvider>
          <Screen>
            <View/>
          </Screen>
        </SafeAreaProvider>,
      );
      expect(dom.queryByTestId('screen-bars')).toBeNull();
    });

    it('draws a bar where the control is without a screen, a bottom one over the bottom edge', () => {
      renderDom(
        <View testID="box">
          <ScreenBar edge="top"><Text testID="top">Top</Text></ScreenBar>
          <ScreenBar edge="bottom"><Text testID="bottom">Bottom</Text></ScreenBar>
        </View>,
      );
      const box = dom.getByTestId('box');
      expect(box.contains(dom.getByTestId('top'))).toBe(true);
      const bottom = dom.getByTestId('bottom').parentElement!;
      expect(box.contains(bottom)).toBe(true);
      expect(getComputedStyle(bottom).position).toBe('absolute');
    });
    return;
  }

  it('draws a top bar above the content and a bottom bar below it, and lifts the fab above the bottom one', async () => {
    await render(
      <SafeAreaProvider>
        <Screen fab={<Text>New</Text>}>
          <View testID="kid">
            <Control edge="bottom" label="bottom"/>
            <Control edge="top" label="top"/>
          </View>
        </Screen>
      </SafeAreaProvider>,
    );
    const kid = screen.getByTestId('kid');
    const content = kid.parent!;
    const root = content.parent!;
    const top = screen.getByTestId('bar-top');
    expect(kid).not.toContainElement(top);
    expect(top.parent).toBe(screen.getByTestId('screen-top-rows'));
    expect(root.children.indexOf(top.parent!)).toBeLessThan(root.children.indexOf(content));
    const bars = screen.getByTestId('screen-bars');
    expect(bars).toContainElement(screen.getByTestId('bar-bottom'));
    // The fab sits above the bars, by their measured height, on top of the safe area it already paid.
    const bottom = () => StyleSheet.flatten(screen.getByTestId('screen-fab').props.style).bottom as number;
    const paid = bottom();
    expect(paid).toBeGreaterThanOrEqual(spacing.three);
    await fireEvent(bars, 'layout', {nativeEvent: {layout: {x: 0, y: 0, width: 390, height: 56}}});
    expect(bottom()).toBe(paid + 56);
  });

  it('draws a bar where the control is without a screen, a bottom one over the bottom edge', async () => {
    await render(
      <View testID="box">
        <ScreenBar edge="top"><Text testID="top">Top</Text></ScreenBar>
        <ScreenBar edge="bottom"><Text testID="bottom">Bottom</Text></ScreenBar>
      </View>,
    );
    const box = screen.getByTestId('box');
    expect(box).toContainElement(screen.getByTestId('top'));
    expect(screen.getByTestId('bottom').parent).toHaveStyle({position: 'absolute', left: 0, right: 0, bottom: 0});
  });
});
