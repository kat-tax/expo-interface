import {useContext, useEffect} from 'react';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {Animated, PlatformColor, Text, View} from 'react-native';
import {DrawnSearchContext} from '../header-search/shared';
import {useNativeHost} from '../host';
import {setColorScheme} from '../scheme';
import {StackHeaderContext} from '../stack-header/context';
import {bound, colors, spacing} from '../theme';
import {ToastInsetContext} from '../toast/context';
import {ScreenBar} from './bars';
import {ScreenHeader} from './header';
import {hostAccentProps} from './host-accent';
import {Screen} from '.';

function Hosted() {
  return <Text>{useNativeHost() ? 'hosted' : 'bare'}</Text>;
}

/** What a toast under the screen does: reports what it covers of the bottom edge. */
function ToastStandIn({height}: {height: number}) {
  const report = useContext(ToastInsetContext);
  useEffect(() => {
    report(height);
  }, [height, report]);
  return null;
}

describe('Screen (windows)', () => {
  afterEach(() => {
    setColorScheme('system');
  });

  it('paints the scheme background and constrains the content width', async () => {
    await render(<Screen><View testID="kid"/></Screen>);
    const content = screen.getByTestId('kid').parent!;
    expect(content).toHaveStyle({maxWidth: bound.contentMaxWidth});
    const root = content.parent!;
    expect(root).toHaveStyle({paddingTop: 0});
    expect(root.parent).toHaveStyle({backgroundColor: colors.light.background});
    expect(content).not.toHaveStyle({paddingHorizontal: spacing.three});
  });

  it('marks native children as hosted, without a host of their own', async () => {
    await render(<Screen native><Hosted/></Screen>);
    expect(screen.getByText('hosted')).toBeOnTheScreen();
    await screen.unmount();
    await render(<Screen><Hosted/></Screen>);
    expect(screen.getByText('bare')).toBeOnTheScreen();
  });

  it('adds a gutter on request and skips the top inset under a header', async () => {
    await render(
      <StackHeaderContext.Provider value={true}>
        <Screen gutter header={false}><View testID="kid"/></Screen>
      </StackHeaderContext.Provider>,
    );
    expect(screen.getByTestId('kid').parent).toHaveStyle({paddingHorizontal: spacing.three});
  });

  it('places the floating action button over the content', async () => {
    await render(<Screen fab={<Text>Add</Text>}><View/></Screen>);
    expect(screen.getByTestId('screen-fab')).toHaveStyle({position: 'absolute', right: spacing.three, bottom: spacing.three});
    expect(screen.getByText('Add')).toBeOnTheScreen();
  });

  it('draws a bar a control gives it at its bottom, and lifts the floating action button above it', async () => {
    await render(
      <Screen fab={<Text>Add</Text>}>
        <ScreenBar edge="bottom"><Text testID="bar">Search</Text></ScreenBar>
      </Screen>,
    );
    const bars = screen.getByTestId('screen-bars');
    expect(bars).toContainElement(screen.getByTestId('bar'));
    expect(screen.getByTestId('screen-fab')).toHaveStyle({bottom: spacing.three});
    await fireEvent(bars, 'layout', {nativeEvent: {layout: {x: 0, y: 0, width: 800, height: 48}}});
    expect(screen.getByTestId('screen-fab')).toHaveStyle({bottom: spacing.three + 48});
  });

  it('lifts the floating action button above a toast that reports its height', async () => {
    const timing = vi.spyOn(Animated, 'timing');
    try {
      await render(
        <Screen fab={<Text>Add</Text>}>
          <ToastStandIn height={74}/>
        </Screen>,
      );
      expect(timing).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({toValue: -74, useNativeDriver: true}));
      expect(screen.getByText('Add')).toBeOnTheScreen();
    } finally {
      timing.mockRestore();
    }
  });

  it('has no host to seed', () => {
    expect(hostAccentProps('#8959EA')).toEqual({});
  });

  it('follows a forced dark scheme', async () => {
    await render(<Screen><View testID="kid"/></Screen>);
    await act(async () => setColorScheme('dark'));
    expect(screen.getByTestId('kid').parent!.parent!.parent).toHaveStyle({backgroundColor: colors.dark.background});
  });
});

describe('ScreenHeader (windows)', () => {
  it('draws the title, a back arrow and the trailing slot in a 48-point row', async () => {
    const onBack = vi.fn();
    await render(<ScreenHeader title="Drops" onBack={onBack} trailing={<Text>New</Text>}/>);
    expect(screen.getByText('Drops').parent).toHaveStyle({height: 48});
    expect(screen.getByText('')).toBeOnTheScreen();
    expect(screen.getByText('New')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Go back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('has no back arrow on a root screen', async () => {
    await render(<ScreenHeader title="Drops"/>);
    expect(screen.queryByLabelText('Go back')).toBeNull();
  });

  it('draws the search where its placement says, automatic beside the title, and lets go of the title for an open action', async () => {
    const {rerender} = await render(<ScreenHeader title="Drops" search={{placement: 'stacked', node: <SearchStandIn/>}}/>);
    const row = () => screen.getByText('Drops').parent!;
    expect(row()).not.toContainElement(screen.getByText('search:stacked'));
    expect(row().parent!).toContainElement(screen.getByText('search:stacked'));

    await rerender(<ScreenHeader title="Drops" search={{placement: 'automatic', node: <SearchStandIn/>}}/>);
    expect(row()).toContainElement(screen.getByText('search:inline'));

    await rerender(<ScreenHeader title="Drops" search={{placement: 'action', node: <SearchStandIn/>}}/>);
    expect(row()).toContainElement(screen.getByText('search:action'));
    await fireEvent.press(screen.getByText('search:action'));
    expect(screen.queryByText('Drops')).toBeNull();
    expect(screen.getByText('search:action')).toBeOnTheScreen();
  });
});

/** A stand-in for the search element: says which placement the header resolved, and opens as an action does. */
function SearchStandIn() {
  const site = useContext(DrawnSearchContext)!;
  return <Text onPress={() => site.setOpen(true)}>{`search:${site.placement}`}</Text>;
}

describe('ScreenHeader back button (windows)', () => {
  it('takes the subtle fill under the pointer', async () => {
    await render(<ScreenHeader title="Drops" onBack={vi.fn()}/>);
    const back = screen.getByLabelText('Go back');
    await fireEvent(back, 'hoverIn');
    expect(back).toHaveStyle({backgroundColor: PlatformColor('SubtleFillColorSecondary')});
    await fireEvent(back, 'hoverOut');
    expect(back).not.toHaveStyle({backgroundColor: PlatformColor('SubtleFillColorSecondary')});
  });
});
