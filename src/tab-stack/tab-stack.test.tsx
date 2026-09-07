import {Platform, Text} from 'react-native';
import {screen as dom} from '@testing-library/react';
import {renderHook, screen} from '@testing-library/react-native';
import {AccentProvider} from '../accent';
import {colors, theme} from '../theme';
import {stackHeaders} from '../__tests__/native';
import {renderApp} from '../__tests__/router';
import {ConstrainedStackHeader} from '../stack-header';
import {TabStack} from '.';

const app = {
  _layout: () => <TabStack title="Drops"/>,
  index: () => <Text>Home screen</Text>,
};

describe(`TabStack (${Platform.OS})`, () => {
  it('configures the stack header per platform and titles the index screen', async () => {
    const {result} = await renderHook(() => TabStack({title: 'Drops'}), {
      wrapper: ({children}) => <AccentProvider seed="#8959EA">{children}</AccentProvider>,
    });
    // The stack sits under the header context, so `Screen` knows without being told.
    expect(result.current.props.value).toBe(true);
    const {screenOptions, children} = result.current.props.children.props;
    expect(screenOptions).toMatchObject({
      headerShown: true,
      headerShadowVisible: false,
      headerBackButtonDisplayMode: 'minimal',
    });
    // Web draws the header itself; the native stacks use their own bar.
    expect(screenOptions.header).toBe(Platform.OS === 'web' ? ConstrainedStackHeader : undefined);
    if (Platform.OS === 'web') {
      expect(screenOptions.headerTintColor).toBe(theme.label);
      expect(screenOptions.headerStyle).toEqual({backgroundColor: theme.background});
    } else {
      expect(screenOptions.headerTintColor).toBe(colors.light.label);
      expect(screenOptions.headerTitleStyle).toEqual({color: colors.light.label});
      expect(screenOptions.headerStyle).toEqual({backgroundColor: colors.light.background});
    }
    expect(children.props).toEqual({name: 'index', options: {title: 'Drops'}});
  });

  it('passes the header trailing slot to the index screen', async () => {
    const headerRight = () => <Text>New…</Text>;
    const {result} = await renderHook(() => TabStack({title: 'Drops', headerRight}));
    expect(result.current.props.children.props.children.props.options).toEqual({title: 'Drops', headerRight});
  });

  if (Platform.OS === 'web') {
    it('renders the index screen under the web stack header', async () => {
      await renderApp(app);
      expect(dom.getByText('Home screen')).toBeInTheDocument();
      expect(dom.getByText('Drops')).toBeInTheDocument();
    });
  } else {
    it('renders the native header with the title', async () => {
      await renderApp(app);
      const header = stackHeaders().find(h => h.title === 'Drops');
      expect(header).toMatchObject({
        hidden: false,
        backgroundColor: colors.light.background,
        titleColor: colors.light.label,
      });
      expect(screen.getByText('Home screen')).toBeOnTheScreen();
    });
  }
});
