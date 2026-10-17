import type {PlatformIOSStatic} from 'react-native';
import {Dimensions, Platform, StyleSheet, Text} from 'react-native';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {byComposeTestID, host, modifier, nodes} from 'expo-vitest/native';
import {Button} from '../button';
import {NativeHost, useNativeHost} from '../host';
import {BAR_HEIGHT, BAR_SIDE} from './shared';
import {Sheet} from '.';

const isIOS = Platform.OS === 'ios';

/** Says whether the kit's controls at this point would render bare, inside a host, or mount one. */
function Hosted({name}: {name: string}) {
  return <Text>{`${name} ${useNativeHost() ? 'hosted' : 'bare'}`}</Text>;
}

/** Presses one of the kit's buttons through the native view's own event: SwiftUI's `onButtonPress`, Compose's `onButtonPressed`. */
async function press(testID: string) {
  if (isIOS) {
    await fireEvent(screen.getByTestId(testID), 'buttonPress');
  } else {
    // The native view of the button with this testID; a disabled one has no handler, and a press does nothing.
    const [button] = screen.container.queryAll(i => 'onButtonPressed' in i.props && modifier(i.props, 'testID')?.testID === testID);
    if (typeof button.props.onButtonPressed === 'function') await fireEvent(button, 'buttonPressed');
  }
}

const hasTestID = (testID: string) => isIOS
  ? screen.queryByTestId(testID) !== null
  : nodes().some(n => modifier(n.props, 'testID')?.testID === testID);

/** Reports the width the sheet offers its column, as SwiftUI's `onGeometryChange` and Compose's `onSizeChanged` do. */
async function measure(width: number) {
  const type = isIOS ? 'onGeometryChange' : 'onSizeChanged';
  const column = host(p => modifier(p, type) != null);
  const size = isIOS ? {x: 0, y: 400, width, height: 320} : {width, height: 320};
  await act(async () => modifier(column.props, type)?.eventListener(size));
}

/** The width the capped body's scroll view and the footer's box are told. */
const widths = () => [
  StyleSheet.flatten(screen.getByTestId('sheet-body').props.style).width,
  StyleSheet.flatten(screen.getByTestId('sheet-footer').props.style).width,
];

/** The bar's own stack or row. */
const bar = () => (isIOS ? host(p => p.testID === 'sheet-bar') : byComposeTestID('sheet-bar'));

/** The least width of a node, where it has one: SwiftUI's frame, Compose's default least size. */
const leastWidth = (props: Record<string, unknown>): number | undefined => (isIOS ? modifier(props, 'frame')?.minWidth : modifier(props, 'defaultMinSize')?.minWidth);

/** The least width of each of the bar's two ends, leading first. */
const sides = () => nodes(bar()).map(n => leastWidth(n.props)).filter(width => width !== undefined);

/** How an end's content reports its size: SwiftUI's `onGeometryChange`, Compose's `onSizeChanged`. */
const SIZE = isIOS ? 'onGeometryChange' : 'onSizeChanged';

/** The content of each end, leading first: the stack or row that reports its width. */
const contents = () => nodes(bar()).filter(n => modifier(n.props, SIZE) != null);

/** Reports the width of the leading (0) or the trailing (1) end's content. */
async function report(end: 0 | 1, width: number) {
  const size = isIOS ? {x: 0, y: 0, width, height: 30} : {width, height: 30};
  await act(async () => modifier(contents()[end]!.props, SIZE)?.eventListener(size));
}

/** Whether the bar holds the accessory, a `Text` with the `filter` test identifier. */
const inBar = () => nodes(bar()).some(n => n.props.testID === 'filter');

describe(`Sheet chrome (${Platform.OS})`, () => {
  it('draws the bar as native content: the title over the subtitle, back and close at the ends, the menu before close', async () => {
    const onBack = vi.fn();
    const onClose = vi.fn();
    await render(
      <Sheet isPresented onDismiss={() => {}} title="Comments" subtitle="12 unresolved" onBack={onBack} onClose={onClose} menu={[{label: 'Resolve all'}]} testID="sheet">
        <Text>Body</Text>
      </Sheet>,
    );
    const title = host(p => p.text === 'Comments');
    const subtitle = host(p => p.text === '12 unresolved');
    if (isIOS) {
      expect(modifier(title.props, 'font')).toMatchObject({size: 17, weight: 'semibold'});
      expect(modifier(subtitle.props, 'font')).toMatchObject({size: 13});
      // One line each, cut short where the ends leave less room.
      expect(modifier(title.props, 'lineLimit')).toMatchObject({limit: 1});
      expect(modifier(subtitle.props, 'lineLimit')).toMatchObject({limit: 1});
      const bar = screen.getByTestId('sheet-bar');
      expect(modifier(bar.props, 'frame')).toMatchObject({maxWidth: Infinity, minHeight: BAR_HEIGHT});
    } else {
      expect(title.props.typography).toBe('titleMedium');
      expect(subtitle.props.typography).toBe('bodySmall');
      expect(modifier(byComposeTestID('sheet-bar').props, 'height')).toMatchObject({height: BAR_HEIGHT});
    }
    // The two ends are the same width whichever holds a button, so the title stays centred.
    expect(sides()).toEqual([BAR_SIDE, BAR_SIDE]);
    await press('sheet-bar-back');
    await press('sheet-bar-close');
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    // The platform's menu, in the bar.
    expect(host(p => p.text === 'Resolve all' || p.label === 'Resolve all')).toBeTruthy();
  });

  it('draws a bar with a title alone, and the actions, without a test identifier', async () => {
    await render(
      <Sheet isPresented onDismiss={() => {}} title="Plain" menu={[]} actions={[{label: 'OK'}]}>
        <Text>Body</Text>
      </Sheet>,
    );
    expect(host(p => p.text === 'Plain')).toBeTruthy();
    expect(host(p => p.text === 'OK' || p.label === 'OK')).toBeTruthy();
    expect(nodes().some(n => n.props.label === 'More' || n.props.text === 'More')).toBe(false);
  });

  it('draws the bar for a close button alone, with no title in it', async () => {
    const onClose = vi.fn();
    await render(
      <Sheet isPresented onDismiss={() => {}} onClose={onClose} testID="sheet">
        <Text>Body</Text>
      </Sheet>,
    );
    expect(hasTestID('sheet-bar')).toBe(true);
    await press('sheet-bar-close');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('draws no bar, no actions and no scrolling body when nothing asks for them', async () => {
    await render(
      <Sheet isPresented onDismiss={() => {}} menu={[]} testID="sheet">
        <Text>Body</Text>
      </Sheet>,
    );
    expect(hasTestID('sheet-bar')).toBe(false);
    expect(hasTestID('sheet-actions')).toBe(false);
    expect(screen.queryByTestId('sheet-body')).toBeNull();
    expect(screen.getByText('Body')).toBeOnTheScreen();
  });

  it('lays the actions out as one native row along the bottom edge, and presses them', async () => {
    const onSave = vi.fn();
    await render(
      <Sheet isPresented onDismiss={() => {}} actions={[{label: 'Cancel'}, {label: 'Save', onPress: onSave}]} testID="sheet">
        <Text>Body</Text>
      </Sheet>,
    );
    if (isIOS) {
      expect(modifier(screen.getByTestId('sheet-actions').props, 'frame')).toMatchObject({alignment: 'trailing'});
    } else {
      expect(byComposeTestID('sheet-actions').props.horizontalArrangement).toBe('end');
    }
    expect(host(p => p.text === 'Cancel' || p.label === 'Cancel')).toBeTruthy();
    await press('sheet-actions-1');
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('caps the body in a scroll view the sheet\'s width, between the accessory and the footer, both hosted in the sheet', async () => {
    await render(
      <Sheet isPresented onDismiss={() => {}} title="Comments" accessory={<Text>Filter</Text>} footer={<Text>Write</Text>} maxHeight={300} testID="sheet">
        <Text>Body</Text>
      </Sheet>,
    );
    const body = screen.getByTestId('sheet-body');
    const window = Dimensions.get('window').width;
    // A phone's sheet is the window's width; an iPad's is a form sheet, and Material caps a sheet at 640.
    const sheet = isIOS ? window : Math.min(window, 640);
    expect(StyleSheet.flatten(body.props.style)).toMatchObject({maxHeight: 300, width: sheet - 32});
    // Android hands a drag in the body to the sheet, which expands before the body scrolls.
    expect(body.props.nestedScrollEnabled).toBe(true);
    expect(StyleSheet.flatten(screen.getByTestId('sheet-footer').props.style).width).toBe(sheet - 32);
    // The capped body and the footer each sit in an RNHostView that sizes to them and, as content
    // the sheet presents in its own window, dispatches its own touches: RNTL cannot press through
    // the sheet's `pointerEvents="none"` host, so `layoutRoot` stands in for a press.
    const hosts = nodes().filter(n => n.type.endsWith('RNHostView'));
    expect(hosts).toHaveLength(2);
    expect(hosts.every(n => n.props.matchContentsHorizontal === true && n.props.matchContentsVertical === true && n.props.layoutRoot === true)).toBe(true);
    expect(screen.getByText('Body')).toBeOnTheScreen();
    const json = JSON.stringify(screen.toJSON());
    expect(json.indexOf('Comments')).toBeLessThan(json.indexOf('Filter'));
    expect(json.indexOf('Filter')).toBeLessThan(json.indexOf('"Body"'));
    expect(json.indexOf('"Body"')).toBeLessThan(json.indexOf('Write'));
  });

  it('counts the bar\'s row, the accessory and an uncapped body as hosted, and the capped body and the footer as React Native content that mounts its own hosts', async () => {
    await render(
      <Sheet isPresented onDismiss={() => {}} title="Comments" onClose={() => {}} accessory={<Hosted name="accessory"/>} footer={<Hosted name="footer"/>} maxHeight={300} testID="sheet">
        <Hosted name="body"/>
      </Sheet>,
    );
    expect(screen.getByText('accessory hosted')).toBeOnTheScreen();
    expect(screen.getByText('body bare')).toBeOnTheScreen();
    expect(screen.getByText('footer bare')).toBeOnTheScreen();
    // The bar's close button renders bare: the sheet's own host is the only one.
    expect(hasTestID('sheet-bar-close')).toBe(true);
    expect(nodes().filter(n => n.type === 'ViewManagerAdapter_ExpoUI_HostView')).toHaveLength(1);
    await render(
      <Sheet isPresented onDismiss={() => {}}>
        <Hosted name="body"/>
      </Sheet>,
    );
    expect(screen.getByText('body hosted')).toBeOnTheScreen();
    // A kit control in the footer mounts a host of its own beside the sheet's.
    await render(
      <Sheet isPresented onDismiss={() => {}} footer={<Button label="Reply"/>}>
        <Text>Body</Text>
      </Sheet>,
    );
    expect(nodes().filter(n => n.type === 'ViewManagerAdapter_ExpoUI_HostView')).toHaveLength(2);
  });

  it('leaves an uncapped body without a footer as it is, with nothing hosted', async () => {
    await render(
      <Sheet isPresented onDismiss={() => {}} footer={false} testID="sheet">
        <Text>Body</Text>
      </Sheet>,
    );
    expect(nodes().some(n => n.type.endsWith('RNHostView'))).toBe(false);
    expect(screen.queryByTestId('sheet-footer')).toBeNull();
  });

  it('gives `@expo/ui` content of the app\'s own in the footer a host of its own inside a NativeHost', async () => {
    await render(
      <Sheet isPresented onDismiss={() => {}} footer={<NativeHost><Hosted name="notice"/></NativeHost>}>
        <Text>Body</Text>
      </Sheet>,
    );
    // The footer is React Native content with no host above it, so the NativeHost mounts one beside the sheet's.
    expect(screen.getByText('notice hosted')).toBeOnTheScreen();
    expect(nodes().filter(n => n.type === 'ViewManagerAdapter_ExpoUI_HostView')).toHaveLength(2);
  });

  it('takes the sheet\'s own padding off the body\'s width', async () => {
    await render(
      <Sheet isPresented onDismiss={() => {}} maxHeight={200} contentPadding={{left: 8, right: 8}} testID="sheet">
        <Text>Body</Text>
      </Sheet>,
    );
    const window = Dimensions.get('window').width;
    const sheet = isIOS ? window : Math.min(window, 640);
    expect(StyleSheet.flatten(screen.getByTestId('sheet-body').props.style).width).toBe(sheet - 16);
  });

  it('caps the body at a fraction of the window\'s height, and follows the window', async () => {
    const phone = Dimensions.get('window');
    try {
      await render(
        <Sheet isPresented onDismiss={() => {}} maxHeight={{fraction: 0.5}} testID="sheet">
          <Text>Body</Text>
        </Sheet>,
      );
      expect(StyleSheet.flatten(screen.getByTestId('sheet-body').props.style).maxHeight).toBe(phone.height * 0.5);
      await act(async () => Dimensions.set({window: {...phone, height: 1000}}));
      expect(StyleSheet.flatten(screen.getByTestId('sheet-body').props.style).maxHeight).toBe(500);
    } finally {
      await act(async () => Dimensions.set({window: phone}));
    }
  });

  it('tells the body and the footer the width the sheet\'s column measures, through a rotation, and keeps it through a pass with none', async () => {
    await render(
      <Sheet isPresented onDismiss={() => {}} footer={<Text>Write</Text>} maxHeight={300} testID="sheet">
        <Text>Body</Text>
      </Sheet>,
    );
    // Inside the sheet's padding, its safe areas and its own limit: the content's width, whatever the window's.
    await measure(700);
    expect(widths()).toEqual([700, 700]);
    await measure(0);
    expect(widths()).toEqual([700, 700]);
    await measure(358);
    expect(widths()).toEqual([358, 358]);
  });

  it('tells a phone in landscape a sheet as wide as the window before the column measures, at most Material\'s 640 on Android', async () => {
    const phone = Dimensions.get('window');
    Dimensions.set({window: {...phone, width: 844, height: 390}});
    try {
      await render(
        <Sheet isPresented onDismiss={() => {}} footer={<Text>Write</Text>} maxHeight={300} testID="sheet">
          <Text>Body</Text>
        </Sheet>,
      );
      // An iPhone's sheet in compact height fills the screen: the form sheet's width is an iPad's alone.
      const width = (isIOS ? 844 : 640) - 32;
      expect(widths()).toEqual([width, width]);
    } finally {
      await act(async () => Dimensions.set({window: phone}));
    }
  });

  it('tells the body and the footer a tablet sheet\'s width, not the window\'s: a form sheet on an iPad, Material\'s 640 on Android', async () => {
    const phone = Dimensions.get('window');
    const pad = isIOS ? vi.spyOn(Platform as PlatformIOSStatic, 'isPad', 'get').mockReturnValue(true) : undefined;
    Dimensions.set({window: {...phone, width: 1180}});
    try {
      await render(
        <Sheet isPresented onDismiss={() => {}} footer={<Text>Write</Text>} maxHeight={300} testID="sheet">
          <Text>Body</Text>
        </Sheet>,
      );
      const width = (isIOS ? 540 : 640) - 32;
      expect(widths()).toEqual([width, width]);
    } finally {
      // The sheet is still mounted, and the change re-renders the pieces that read the window.
      await act(async () => Dimensions.set({window: phone}));
      pad?.mockRestore();
    }
  });
});

describe(`Sheet accessory (${Platform.OS})`, () => {
  const filter = <Text testID="filter">Filter</Text>;

  it('puts the accessory placed in the bar in the leading end\'s content, after the back button, as native content', async () => {
    await render(
      <Sheet isPresented onDismiss={() => {}} title="Comments" onBack={() => {}} onClose={() => {}} accessory={filter} accessoryPlacement="bar" testID="sheet">
        <Text>Body</Text>
      </Sheet>,
    );
    const inside = nodes(contents()[0]);
    const back = inside.findIndex(n => (isIOS ? n.props.testID : modifier(n.props, 'testID')?.testID) === 'sheet-bar-back');
    const accessory = inside.findIndex(n => n.props.testID === 'filter');
    expect(back).toBeGreaterThanOrEqual(0);
    expect(accessory).toBeGreaterThan(back);
    // Drawn once: in the bar, and in no row under it.
    expect(screen.getAllByTestId('filter')).toHaveLength(1);
    // SwiftUI: at its own ideal width, so a control that grows to the room offered does not take the bar.
    if (isIOS) expect(modifier(contents()[0]!.props, 'fixedSize')).toMatchObject({horizontal: true, vertical: false});
  });

  it('makes both ends as wide as the wider end\'s content, so the title stays centred', async () => {
    await render(
      <Sheet isPresented onDismiss={() => {}} title="Comments" onClose={() => {}} menu={[{label: 'Resolve all'}]} accessory={filter} accessoryPlacement="bar" testID="sheet">
        <Text>Body</Text>
      </Sheet>,
    );
    expect(sides()).toEqual([BAR_SIDE, BAR_SIDE]);
    await measure(600);
    await report(0, 150);
    await report(1, 60);
    expect(sides()).toEqual([150, 150]);
    expect(inBar()).toBe(true);
  });

  it('moves the accessory to a row of its own under a bar too narrow for it, and back once the bar widens', async () => {
    await render(
      <Sheet isPresented onDismiss={() => {}} title="Comments" onClose={() => {}} accessory={filter} accessoryPlacement="bar" testID="sheet">
        <Text>Body</Text>
      </Sheet>,
    );
    // Before the sheet's column is measured the bar counts as having room.
    await report(0, 120);
    await report(1, 30);
    expect(inBar()).toBe(true);
    // 300 less two ends of 120 would leave the title 60, under its 96: a row of its own, under the bar and over the body.
    await measure(300);
    expect(inBar()).toBe(false);
    const json = JSON.stringify(screen.toJSON());
    expect(json.indexOf('Comments')).toBeLessThan(json.indexOf('Filter'));
    expect(json.indexOf('Filter')).toBeLessThan(json.indexOf('"Body"'));
    // The leading end, empty without it, reports again: the ends narrow, and the width it had with the accessory still decides.
    await report(0, 0);
    expect(sides()).toEqual([BAR_SIDE, BAR_SIDE]);
    expect(inBar()).toBe(false);
    await measure(400);
    expect(inBar()).toBe(true);
  });
});
