import {Text} from 'react-native';
import {render, screen} from '@testing-library/react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {TabBarContext} from '../tabs/context';
import {inset} from '../theme';
import {ScreenScrollView} from './scroll';
import {Screen} from '.';

describe('ScreenScrollView (web)', () => {
  it('pads its content by the tab bar it passes under, on top of its own padding', () => {
    render(
      <SafeAreaProvider>
        <TabBarContext.Provider value={true}>
          <Screen underBar>
            <ScreenScrollView testID="s" contentContainerStyle={{padding: 16}}>
              <Text>Body</Text>
            </ScreenScrollView>
          </Screen>
        </TabBarContext.Provider>
      </SafeAreaProvider>,
    );
    const content = screen.getByTestId('s').firstElementChild!;
    expect(content.contains(screen.getByText('Body'))).toBe(true);
    expect(getComputedStyle(content).paddingTop).toBe(`${inset.topBar + 16}px`);
    // No tab action floats on the web: the bottom keeps the style's own.
    expect(getComputedStyle(content).paddingBottom).toBe('16px');
  });
});
