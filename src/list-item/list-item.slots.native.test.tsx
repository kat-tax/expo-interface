import {Platform, Text} from 'react-native';
import {act, render, screen} from '@testing-library/react-native';
import * as icons from '../__stories__/icons';
import {NativeHostContext} from '../host';
import {colors} from '../theme';
import {byComposeTestID, host, modifier, nodes} from 'expo-vitest/native';
import {ListItem} from '.';

const isIOS = Platform.OS === 'ios';
const row = (testID: string) => isIOS ? screen.getByTestId(testID) : byComposeTestID(testID);
const slot = (name: string) => nodes().filter(n => n.props?.slotName === name);

/** Inside a host, as a row in a list is. */
const options = {wrapper: ({children}: React.PropsWithChildren) => <NativeHostContext.Provider value={true}>{children}</NativeHostContext.Provider>};

describe(`ListItem slots (${Platform.OS})`, () => {
  it('draws an icon at the start in its tone, before the leading content', async () => {
    await render(
      <>
        <ListItem icon={icons.share} leading={<Text>L</Text>} testID="row">Share</ListItem>
        <ListItem icon={icons.star} iconTone="accent" testID="toned">Star</ListItem>
      </>,
      options,
    );
    if (isIOS) {
      const share = host(p => p.systemName === 'square.and.arrow.up');
      expect(modifier(share.props, 'foregroundStyle')?.style.color).toBe(colors.light.secondaryLabel);
      expect(modifier(share.props, 'font')?.size).toBe(24);
      expect(modifier(host(p => p.systemName === 'star').props, 'foregroundStyle')?.style.color).toBe(colors.light.tint);
      expect(screen.getByText('L')).toBeOnTheScreen();
    } else {
      const [share, star] = nodes().filter(n => n.type.endsWith('IconView'));
      expect(share.props).toMatchObject({size: 24, tint: colors.light.secondaryLabel});
      expect(star.props.tint).toBe(colors.light.tint);
      expect(JSON.stringify(slot('leadingContent')[0])).toContain('"L"');
    }
  });

  it('draws a value and a badge at the end, before the trailing content', async () => {
    await render(
      <ListItem value="2 KB" badge={3} trailing={<Text>T</Text>} testID="row">Essay</ListItem>,
      options,
    );
    if (isIOS) {
      const value = host(p => p.text === '2 KB');
      expect(modifier(value.props, 'foregroundStyle')?.style.color).toBe(colors.light.secondaryLabel);
      // The kit's drawn badge, inside the trailing accessory.
      expect(screen.getByLabelText('3 new')).toBeOnTheScreen();
      expect(screen.getByText('T')).toBeOnTheScreen();
    } else {
      expect(host(p => p.text === '2 KB').props.color).toBe(colors.light.secondaryLabel);
      expect(nodes().some(n => n.type.includes('Badge'))).toBe(true);
      expect(host(p => p.text === '3')).toBeTruthy();
      expect(JSON.stringify(slot('trailingContent')[0])).toContain('"T"');
    }
  });

  it('draws a dot for a badge of true, and names the row from its slots', async () => {
    await render(<ListItem supporting="Edited" value="2 KB" badge testID="row">Essay</ListItem>, options);
    if (isIOS) {
      expect(screen.getByLabelText('New')).toBeOnTheScreen();
      expect(modifier(row('row').props, 'accessibilityLabel')?.label).toBe('Essay, Edited, 2 KB, new');
    } else {
      const badge = nodes().find(n => n.type.includes('Badge'))!;
      expect(badge).toBeTruthy();
      // A dot holds nothing; the value is the only text in the trailing slot.
      expect(badge.children ?? []).toHaveLength(0);
    }
  });

  it('draws a value alone, or a badge alone', async () => {
    await render(
      <>
        <ListItem value="2 KB" testID="valued">Essay</ListItem>
        <ListItem badge={2} testID="badged">Notes</ListItem>
      </>,
      options,
    );
    expect(host(p => p.text === '2 KB')).toBeTruthy();
    const badges = nodes().filter(n => isIOS ? n.props.accessibilityLabel === '2 new' : n.type.includes('Badge'));
    expect(badges).toHaveLength(1);
    if (isIOS) {
      expect(modifier(row('valued').props, 'accessibilityLabel')?.label).toBe('Essay, 2 KB');
      expect(modifier(row('badged').props, 'accessibilityLabel')?.label).toBe('Notes, 2 new');
    } else {
      expect(nodes().filter(n => n.props.text === '2 KB')).toHaveLength(1);
    }
  });

  it('takes the selected fill and says so', async () => {
    await render(
      <>
        <ListItem selected testID="current">Current</ListItem>
        <ListItem selected inset={false} testID="flush">Flush</ListItem>
        <ListItem testID="plain">Plain</ListItem>
      </>,
      options,
    );
    if (isIOS) {
      expect(modifier(row('current').props, 'background')?.style.color).toBe(colors.light.backgroundSelected);
      // And the row's own background, which a List or Form draws to the row's edges.
      expect(modifier(row('current').props, 'listRowBackground')?.color).toBe(colors.light.backgroundSelected);
      expect(modifier(row('current').props, 'accessibilityAddTraits')?.traits).toEqual(['isSelected']);
      expect(modifier(row('plain').props, 'background')).toBeUndefined();
      expect(modifier(row('plain').props, 'listRowBackground')).toBeUndefined();
    } else {
      expect(row('current').props.colors).toEqual({containerColor: colors.light.backgroundSelected});
      expect(modifier(row('flush').props, 'background')?.color).toBe(colors.light.backgroundSelected);
      expect(row('plain').props.colors).toEqual({containerColor: '#00000000'});
    }
  });

  (isIOS ? it : it.skip)('fills a selected row with swipe actions to the row\'s edges as well', async () => {
    await render(
      <ListItem selected swipeActions={[{label: 'Delete', role: 'destructive', onPress: vi.fn()}]} testID="row">Essay</ListItem>,
      options,
    );
    // The row trait rides on the button that the swipe wraps, as `.swipeActions` does.
    expect(modifier(row('row').props, 'listRowBackground')?.color).toBe(colors.light.backgroundSelected);
  });

  (isIOS ? it.skip : it)('says a row that presses is the current one, through Compose\'s selectable', async () => {
    const onPress = vi.fn();
    await render(
      <>
        <ListItem selected onPress={onPress} testID="chosen">Chosen</ListItem>
        <ListItem selected inset={false} onPress={onPress} testID="flush">Flush</ListItem>
        <ListItem onPress={onPress} testID="other">Other</ListItem>
        <ListItem selected testID="inert">Inert</ListItem>
      </>,
      options,
    );
    expect(modifier(row('chosen').props, 'selectable')).toMatchObject({selected: true});
    expect(modifier(row('chosen').props, 'selectable')?.role).toBeUndefined();
    expect(modifier(row('chosen').props, 'clickable')).toBeUndefined();
    expect(modifier(row('flush').props, 'selectable')?.selected).toBe(true);
    // A row that is not the current one is not "Not selected": it is a plain press.
    expect(modifier(row('other').props, 'clickable')).toBeDefined();
    expect(modifier(row('other').props, 'selectable')).toBeUndefined();
    // An inert row has no press to carry the state, so it shows the fill alone.
    expect(modifier(row('inert').props, 'selectable')).toBeUndefined();
    expect(modifier(row('inert').props, 'clickable')).toBeUndefined();
    await act(async () => modifier(row('chosen').props, 'selectable')!.eventListener());
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('leaves the name to content of the app\'s own, and the slots empty without any', async () => {
    await render(<ListItem testID="row"><Text>Rich</Text></ListItem>, options);
    if (isIOS) {
      expect(modifier(row('row').props, 'accessibilityLabel')).toBeUndefined();
    } else {
      expect(slot('leadingContent')).toHaveLength(0);
      expect(slot('trailingContent')).toHaveLength(0);
    }
  });
});
