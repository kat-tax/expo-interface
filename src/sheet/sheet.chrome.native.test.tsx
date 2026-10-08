import {Dimensions, Platform, StyleSheet, Text} from 'react-native';
import {fireEvent, render, screen} from '@testing-library/react-native';
import {byComposeTestID, host, modifier, nodes} from 'expo-vitest/native';
import {Button} from '../button';
import {useNativeHost} from '../host';
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
      const bar = screen.getByTestId('sheet-bar');
      expect(modifier(bar.props, 'frame')).toMatchObject({maxWidth: Infinity, minHeight: BAR_HEIGHT});
      // The two ends are the same width whichever holds a button, so the title stays centred.
      const ends = nodes().filter(n => modifier(n.props, 'frame')?.minWidth === BAR_SIDE);
      expect(ends).toHaveLength(2);
    } else {
      expect(title.props.typography).toBe('titleMedium');
      expect(subtitle.props.typography).toBe('bodySmall');
      expect(modifier(byComposeTestID('sheet-bar').props, 'height')).toMatchObject({height: BAR_HEIGHT});
      expect(nodes().filter(n => modifier(n.props, 'width')?.width === BAR_SIDE)).toHaveLength(2);
    }
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
    // An iPad's sheet is a form sheet, narrower than the window; a phone's is the window's width.
    const sheet = isIOS ? Math.min(window, 540) : window;
    expect(StyleSheet.flatten(body.props.style)).toMatchObject({maxHeight: 300, width: sheet - 32});
    // Android hands a drag in the body to the sheet, which expands before the body scrolls.
    expect(body.props.nestedScrollEnabled).toBe(true);
    expect(StyleSheet.flatten(screen.getByTestId('sheet-footer').props.style).width).toBe(sheet - 32);
    // The capped body and the footer each sit in an RNHostView that sizes to them and, as content
    // the sheet presents in its own window, dispatches its own touches: RNTL cannot press through
    // the sheet's `pointerEvents="none"` host, so `layoutRoot` stands in for a press.
    const hosts = nodes().filter(n => n.type.endsWith('RNHostView'));
    expect(hosts).toHaveLength(2);
    expect(hosts.every(n => n.props.matchContents === true && n.props.layoutRoot === true)).toBe(true);
    expect(screen.getByText('Body')).toBeOnTheScreen();
    const json = JSON.stringify(screen.toJSON());
    expect(json.indexOf('Comments')).toBeLessThan(json.indexOf('Filter'));
    expect(json.indexOf('Filter')).toBeLessThan(json.indexOf('"Body"'));
    expect(json.indexOf('"Body"')).toBeLessThan(json.indexOf('Write'));
  });

  it('counts the bar\'s row, the accessory and an uncapped body as hosted, and the capped body and the footer as React Native content that mounts its own hosts', async () => {
    await render(
      <Sheet isPresented onDismiss={() => {}} accessory={<Hosted name="accessory"/>} footer={<Hosted name="footer"/>} maxHeight={300}>
        <Hosted name="body"/>
      </Sheet>,
    );
    expect(screen.getByText('accessory hosted')).toBeOnTheScreen();
    expect(screen.getByText('body bare')).toBeOnTheScreen();
    expect(screen.getByText('footer bare')).toBeOnTheScreen();
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

  it('takes the sheet\'s own padding off the body\'s width', async () => {
    await render(
      <Sheet isPresented onDismiss={() => {}} maxHeight={200} contentPadding={{left: 8, right: 8}} testID="sheet">
        <Text>Body</Text>
      </Sheet>,
    );
    const window = Dimensions.get('window').width;
    const sheet = isIOS ? Math.min(window, 540) : window;
    expect(StyleSheet.flatten(screen.getByTestId('sheet-body').props.style).width).toBe(sheet - 16);
  });
});
