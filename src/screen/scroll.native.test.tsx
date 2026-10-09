import type {ReactNode} from 'react';
import type {ScrollInsets} from './insets';
import {createRef, useEffect} from 'react';
import {Platform, ScrollView, StyleSheet, Text} from 'react-native';
import {act, render, screen} from '@testing-library/react-native';
import {setInsets} from 'vitest-native/helpers';
import {FloatingHeaderContext, StackHeaderContext} from '../stack-header/context';
import {inset} from '../theme';
import {ScrollInsetsContext, useScrollInsets} from './insets';
import {ScreenScrollView} from './scroll';
import {Screen} from '.';

const isIOS = Platform.OS === 'ios';

/** The view under the insets a screen hands its content. */
const under = (insets: ScrollInsets, node: ReactNode) => (
  <ScrollInsetsContext.Provider value={insets}>{node}</ScrollInsetsContext.Provider>
);

const padding = () => StyleSheet.flatten(screen.getByTestId('s').props.contentContainerStyle);

describe(`ScreenScrollView (${Platform.OS})`, () => {
  it('pads its content and its scroll indicators by the screen\'s insets, and lets a press through the keyboard', async () => {
    await render(under({top: 100, bottom: 72, left: 0, right: 0, automatic: false}, <ScreenScrollView testID="s"><Text>Body</Text></ScreenScrollView>));
    const view = screen.getByTestId('s');
    expect(padding()).toEqual({paddingTop: 100, paddingBottom: 72});
    expect(view.props.scrollIndicatorInsets).toEqual({top: 100, bottom: 72});
    expect(view.props.contentInsetAdjustmentBehavior).toBeUndefined();
    expect(view.props.keyboardShouldPersistTaps).toBe('handled');
    expect(screen.getByText('Body')).toBeOnTheScreen();
  });

  it('adds the insets to the padding its content style gives in points, and keeps the rest of the style', async () => {
    await render(under({top: 100, bottom: 72, left: 0, right: 0, automatic: false}, <ScreenScrollView testID="s" contentContainerStyle={{padding: 16, gap: 8}}/>));
    expect(padding()).toMatchObject({padding: 16, gap: 8, paddingTop: 116, paddingBottom: 88});
  });

  it('reads an edge\'s own padding over the vertical one, as Yoga lays them out', async () => {
    await render(under({top: 100, bottom: 72, left: 0, right: 0, automatic: false}, <ScreenScrollView testID="s" contentContainerStyle={{paddingTop: 4, paddingVertical: 10}}/>));
    expect(padding()).toMatchObject({paddingTop: 104, paddingBottom: 82});
  });

  it('reads the logical block padding as Yoga does: the block\'s over the vertical one, an edge\'s own over its logical one', async () => {
    await render(under({top: 100, bottom: 72, left: 0, right: 0, automatic: false}, <ScreenScrollView testID="s" contentContainerStyle={{paddingBlock: 16, paddingVertical: 2}}/>));
    expect(padding()).toMatchObject({paddingTop: 116, paddingBottom: 88});
    await render(under({top: 100, bottom: 72, left: 0, right: 0, automatic: false}, <ScreenScrollView testID="s" contentContainerStyle={{paddingBlockStart: 6, paddingBlockEnd: 8, paddingBlock: 2}}/>));
    expect(padding()).toMatchObject({paddingTop: 106, paddingBottom: 80});
    await render(under({top: 100, bottom: 72, left: 0, right: 0, automatic: false}, <ScreenScrollView testID="s" contentContainerStyle={{paddingTop: 4, paddingBlockStart: 6, paddingBottom: 3, paddingBlockEnd: 8}}/>));
    expect(padding()).toMatchObject({paddingTop: 104, paddingBottom: 75});
  });

  it('replaces a percentage with the inset, and leaves an edge with no inset as the style gives it', async () => {
    await render(under({top: 100, bottom: 72, left: 0, right: 0, automatic: false}, <ScreenScrollView testID="s" contentContainerStyle={{paddingBottom: '10%'}}/>));
    expect(padding()).toMatchObject({paddingTop: 100, paddingBottom: 72});
    await render(under({top: 0, bottom: 0, left: 0, right: 0, automatic: false}, <ScreenScrollView testID="s" contentContainerStyle={{paddingTop: '5%', paddingBottom: 12}}/>));
    expect(padding()).toEqual({paddingTop: '5%', paddingBottom: 12});
  });

  it('takes UIKit\'s own inset where the platform insets the content under the header itself, and the app\'s elsewhere', async () => {
    await render(under({top: 40, bottom: 0, left: 0, right: 0, automatic: true}, <ScreenScrollView testID="s" contentInsetAdjustmentBehavior="never"/>));
    expect(screen.getByTestId('s').props.contentInsetAdjustmentBehavior).toBe('automatic');
    // What UIKit does not know of, a row floating under the header, is the view's own.
    expect(padding()).toEqual({paddingTop: 40});
    await render(under({top: 40, bottom: 0, left: 0, right: 0, automatic: false}, <ScreenScrollView testID="s" contentInsetAdjustmentBehavior="never"/>));
    expect(screen.getByTestId('s').props.contentInsetAdjustmentBehavior).toBe('never');
  });

  it('lets the app set its own indicator insets and keyboard taps', async () => {
    await render(under({top: 100, bottom: 72, left: 0, right: 0, automatic: false}, (
      <ScreenScrollView testID="s" scrollIndicatorInsets={{top: 1, bottom: 2}} keyboardShouldPersistTaps="never"/>
    )));
    const view = screen.getByTestId('s');
    expect(view.props.scrollIndicatorInsets).toEqual({top: 1, bottom: 2});
    expect(view.props.keyboardShouldPersistTaps).toBe('never');
  });

  it('hands its ref to the scroll view', async () => {
    const ref = createRef<ScrollView>();
    await render(<ScreenScrollView ref={ref}/>);
    expect(ref.current?.scrollTo).toEqual(expect.any(Function));
  });

  it('reads the Screen it is rendered in, where a hook beside the Screen reads nothing', async () => {
    await act(async () => setInsets({top: 47, left: 0, right: 0, bottom: 0}));
    try {
      const beside = {top: -1};
      function Route() {
        const {top} = useScrollInsets();
        useEffect(() => {
          beside.top = top;
        });
        return (
          <Screen underBar>
            <ScreenScrollView testID="s"/>
          </Screen>
        );
      }
      await render(
        <StackHeaderContext.Provider value={true}>
          <FloatingHeaderContext.Provider value={true}>
            <Route/>
          </FloatingHeaderContext.Provider>
        </StackHeaderContext.Provider>,
      );
      if (isIOS) {
        // UIKit insets the view by the header itself.
        expect(screen.getByTestId('s').props.contentInsetAdjustmentBehavior).toBe('automatic');
        expect(padding()).toEqual({});
      } else {
        expect(padding()).toEqual({paddingTop: 47 + inset.header});
      }
      expect(beside.top).toBe(0);
    } finally {
      await act(async () => setInsets({top: 0, left: 0, right: 0, bottom: 0}));
    }
  });
});
