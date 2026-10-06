import type {ReactNode} from 'react';
import {Text} from 'react-native';
import {fireEvent, render, screen} from '@testing-library/react-native';
import * as icons from '../__stories__/icons';
import {InHeaderContext} from '../header/shared';
import {Stack} from '../router/stack';
import {island, islands} from 'expo-vitest/windows';
import {renderApp} from 'expo-vitest/router';
import {HeaderAction} from '../header-action';
import {HeaderMenu} from '../header-menu';
import {HeaderActions} from '.';

const BUTTON = 'ExpoInterfaceButton';

/** The row as a header draws it: inside the header's trailing slot. */
function inHeader(node: ReactNode) {
  return <InHeaderContext.Provider value={true}>{node}</InHeaderContext.Provider>;
}

describe('HeaderActions (windows)', () => {
  it('renders a React Native row of the actions, each a XAML button at the header size', async () => {
    const onShare = vi.fn();
    await render(inHeader(
      <HeaderActions testID="actions">
        <HeaderAction label="Share" icon={icons.share} hideLabel tone="label" onPress={onShare} testID="share"/>
        <HeaderMenu label="Export" icon={icons.settings} items={[{label: 'PDF'}]} testID="export"/>
      </HeaderActions>,
    ));
    const row = screen.getByTestId('actions');
    expect(row.props.style).toMatchObject({flexDirection: 'row', gap: 8});
    const buttons = islands(BUTTON);
    expect(buttons).toHaveLength(2);
    expect(buttons[0].props).toMatchObject({label: 'Share', iconOnly: true, tone: 'label', variant: 'text', size: 'medium', glyphSize: 24});
    expect(buttons[1].props).toMatchObject({label: 'Export', variant: 'text', size: 'medium'});
    await fireEvent(screen.getByTestId('share'), 'press');
    expect(onShare).toHaveBeenCalledTimes(1);
  });

  it('gives a lone action a host of its own', async () => {
    await render(inHeader(<HeaderAction label="Share" onPress={vi.fn()} testID="share"/>));
    expect(island(BUTTON).props.label).toBe('Share');
  });

  it('sends the row to the header the kit\'s stack draws, from the screen it is rendered in', async () => {
    await renderApp({
      _layout: () => <Stack screenOptions={{headerShown: true}}><Stack.Screen name="index" options={{title: 'Drops'}}/></Stack>,
      index: () => (
        <>
          <HeaderActions testID="actions">
            <HeaderAction label="Share" icon={icons.share} hideLabel onPress={vi.fn()} testID="share"/>
          </HeaderActions>
          <Text>Home screen</Text>
        </>
      ),
    });
    expect(screen.getByText('Home screen')).toBeOnTheScreen();
    expect(screen.getByTestId('actions')).toBeOnTheScreen();
    expect(island(BUTTON).props.label).toBe('Share');
  });
});
