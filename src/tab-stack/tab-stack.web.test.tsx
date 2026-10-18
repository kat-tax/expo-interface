import {Text} from 'react-native';
import {screen as dom} from '@testing-library/react';
import {renderHook} from '@testing-library/react-native';
import {AccentProvider} from '../accent';
import {theme} from '../theme';
import {renderApp} from 'expo-vitest/router';
import {ConstrainedStackHeader} from '../stack-header';
import {HeaderSlotContext, createHeaderSlot} from '../tabs/context';
import {TabStack} from '.';

const app = {
  _layout: () => <TabStack title="Drops"/>,
  index: () => <Text>Home screen</Text>,
};

/** The stack element inside the context providers `TabStack` wraps it in. */
function stackOf(result: {current: {props: any}}): {screenOptions: Record<string, any>; children: {props: any}} {
  let node = result.current;
  while (!node.props.screenOptions) node = node.props.children;
  return node.props;
}

describe('TabStack (web)', () => {
  it('configures the stack header per platform and titles the index screen', async () => {
    const {result} = await renderHook(() => TabStack({title: 'Drops'}), {
      wrapper: ({children}) => <AccentProvider seed="#8959EA">{children}</AccentProvider>,
    });
    // The stack sits under the header context, so `Screen` knows without being told.
    expect(result.current.props.value).toBe(true);
    const {screenOptions, children} = stackOf(result);
    expect(screenOptions).toMatchObject({
      headerShown: true,
      headerShadowVisible: false,
      headerBackButtonDisplayMode: 'minimal',
    });
    // Web draws the header itself; the native stacks use their own bar.
    expect(screenOptions.header).toBe(ConstrainedStackHeader);
    expect(screenOptions.headerTintColor).toBe(theme.label);
    expect(screenOptions.headerStyle).toEqual({backgroundColor: theme.background});
    expect(children.props).toMatchObject({name: 'index', options: {title: 'Drops'}});
  });

  it('leaves the top inset to the screen where the header folds into the bar', async () => {
    const slot = createHeaderSlot();
    const {result} = await renderHook(() => TabStack({title: 'Drops'}), {
      wrapper: ({children}) => <HeaderSlotContext.Provider value={slot}>{children}</HeaderSlotContext.Provider>,
    });
    // No header is drawn under the bar, so `Screen` pays the bar's inset itself.
    expect(result.current.props.value).toBe(false);
  });

  it('passes the header trailing slot to the index screen', async () => {
    const headerRight = () => <Text>New…</Text>;
    const {result} = await renderHook(() => TabStack({title: 'Drops', headerRight}));
    expect(stackOf(result).children.props.options).toEqual({title: 'Drops', headerRight});
  });

  it('renders the index screen under the web stack header', async () => {
    await renderApp(app);
    expect(dom.getByText('Home screen')).toBeInTheDocument();
    expect(dom.getByText('Drops')).toBeInTheDocument();
  });
});
