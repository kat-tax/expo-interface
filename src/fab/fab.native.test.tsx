import type {MenuItem} from '../menu/types';
import type {HostNode} from '../__tests__/native';
import {Platform} from 'react-native';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {AccentProvider} from '../accent';
import * as icons from '../__stories__/icons';
import {byComposeTestID, host, modifier, nodes} from '../__tests__/native';
import {FAB_ICON, FAB_RADIUS, FAB_SIZE} from './shared';
import {Fab} from '.';

const isIOS = Platform.OS === 'ios';
const HOST = 'ViewManagerAdapter_ExpoUI_HostView';
const children = (node: HostNode) => (node.children ?? []).filter((c): c is HostNode => typeof c === 'object');
const fab = (testID: string) => isIOS ? screen.getByTestId(testID) : byComposeTestID(testID);
/** The Compose FAB host view (Android). */
const composeFab = () => host(p => typeof p.variant === 'string');
/** The SwiftUI face: the stack sized to the button (iOS). */
const face = () => host(p => !!modifier(p, 'frame'));

const items: MenuItem[] = [
  {label: 'Blank document', icon: icons.add},
  {label: 'Import files…', icon: icons.share},
];

describe(`Fab (${Platform.OS})`, () => {
  it('floats in its own accent-seeded host', async () => {
    await render(
      <AccentProvider seed="#8959EA">
        <Fab label="New" icon={icons.add} onPress={() => {}} testID="new"/>
      </AccentProvider>,
    );
    const hostView = nodes().find(n => n.type === HOST)!;
    expect(hostView.props.matchContentsVertical ?? hostView.props.matchContents).toBeTruthy();
    if (isIOS) {
      expect(modifier(hostView.props, 'tint')?.color).toBe('#8959EA');
    } else {
      expect(hostView.props.seedColor).toBe('#8959EA');
    }
  });

  it('renders a regular button filled with the tint and the icon on it', async () => {
    const onPress = vi.fn();
    await render(<Fab label="New" icon={icons.add} onPress={onPress} testID="new"/>);
    if (isIOS) {
      const button = fab('new');
      expect(modifier(button.props, 'buttonStyle')).toEqual({$type: 'buttonStyle', style: 'plain'});
      expect(modifier(button.props, 'accessibilityLabel')).toEqual({$type: 'accessibilityLabel', label: 'New'});
      expect(modifier(button.props, 'disabled')).toBeUndefined();
      const stack = face();
      expect(modifier(stack.props, 'frame')).toEqual({$type: 'frame', width: FAB_SIZE.regular, height: FAB_SIZE.regular});
      // Material 3's rounded square, in Apple's continuous corners.
      expect(modifier(stack.props, 'background')).toMatchObject({
        color: '#007AFF',
        shape: 'roundedRectangle',
        cornerRadius: FAB_RADIUS.regular,
        roundedCornerStyle: 'continuous',
      });
      expect(modifier(stack.props, 'shadow')).toMatchObject({radius: 4, y: 2});
      expect(modifier(stack.props, 'padding')).toBeUndefined();
      const image = host(p => p.systemName === 'plus');
      // The SwiftUI image's `size` lands as a `font` modifier.
      expect(modifier(image.props, 'font')).toMatchObject({size: FAB_ICON.regular});
      expect(modifier(image.props, 'foregroundStyle')?.color).toBe('#FFFFFF');
      expect(nodes().some(n => n.props.text === 'New')).toBe(false);
      await fireEvent.press(screen.getByTestId('new'));
      expect(onPress).toHaveBeenCalledTimes(1);
    } else {
      const button = composeFab();
      expect(fab('new').props.variant).toBe('medium');
      expect(button.props.variant).toBe('medium');
      expect(button.props.containerColor).toBe('#007AFF');
      expect(modifier(button.props, 'alpha')).toBeUndefined();
      const icon = host(p => p.contentDescription === 'New');
      expect(icon.props).toMatchObject({size: FAB_ICON.regular, tint: '#FFFFFF'});
      expect(host(p => p.slotName === 'icon').children).toContainEqual(icon);
      expect(nodes().some(n => n.props.slotName === 'text')).toBe(false);
      const [view] = screen.container.queryAll(i => typeof i.props.onButtonPressed === 'function');
      await fireEvent(view, 'buttonPressed');
      expect(onPress).toHaveBeenCalledTimes(1);
    }
  });

  it('maps the small and large sizes', async () => {
    await render(
      <>
        <Fab label="Small" icon={icons.add} size="small" testID="small"/>
        <Fab label="Large" icon={icons.add} size="large" testID="large"/>
      </>,
    );
    if (isIOS) {
      const [small, large] = nodes().filter(n => !!modifier(n.props, 'frame'));
      expect(modifier(small.props, 'frame')).toMatchObject({width: 40, height: 40});
      expect(modifier(large.props, 'frame')).toMatchObject({width: 96, height: 96});
      expect(host(p => p.systemName === 'plus' && modifier(p, 'font')?.size === 36)).toBeTruthy();
    } else {
      expect(fab('small').props.variant).toBe('small');
      expect(fab('large').props.variant).toBe('large');
      expect(host(p => p.contentDescription === 'Large').props.size).toBe(36);
    }
  });

  it('takes the circular shape, and the capsule for an extended one', async () => {
    await render(
      <>
        <Fab label="New" icon={icons.add} shape="circle" testID="round"/>
        <Fab label="New document" icon={icons.add} size="extended" shape="circle" testID="capsule"/>
      </>,
    );
    if (isIOS) {
      const [round, capsule] = screen.container
        .queryAll(i => !!modifier(i.props, 'background'))
        .map(n => modifier(n.props, 'background'));
      expect(round).toMatchObject({shape: 'circle'});
      expect(capsule).toMatchObject({shape: 'capsule'});
    } else {
      // Compose draws the rounded square itself; a circle is a clip of half
      // the button's height.
      expect(modifier(byComposeTestID('round').props, 'clip')?.shape).toMatchObject({type: 'roundedCorner', radius: FAB_SIZE.regular / 2});
      expect(modifier(byComposeTestID('capsule').props, 'clip')?.shape).toMatchObject({type: 'roundedCorner', radius: FAB_SIZE.extended / 2});
      // The default shape is Material's own, left to the components.
      await render(<Fab label="New" icon={icons.add} testID="default"/>);
      expect(modifier(byComposeTestID('default').props, 'clip')).toBeUndefined();
    }
  });

  it('shows the label beside the icon when extended', async () => {
    await render(<Fab label="New document" icon={icons.add} size="extended" testID="new"/>);
    if (isIOS) {
      const stack = face();
      expect(modifier(stack.props, 'frame')).toEqual({$type: 'frame', height: 56});
      expect(modifier(stack.props, 'padding')).toEqual({$type: 'padding', horizontal: 20});
      expect(modifier(stack.props, 'background')).toMatchObject({shape: 'roundedRectangle', cornerRadius: FAB_RADIUS.extended});
      const text = host(p => p.text === 'New document');
      expect(modifier(text.props, 'foregroundStyle')?.color).toBe('#FFFFFF');
      expect(modifier(text.props, 'font')).toMatchObject({weight: 'semibold'});
    } else {
      expect(fab('new').props.variant).toBe('extended');
      const text = host(p => p.slotName === 'text');
      expect(host(p => p.text === 'New document', text).props.color).toBe('#FFFFFF');
    }
  });

  it('disables the button', async () => {
    const onPress = vi.fn();
    await render(<Fab label="New" icon={icons.add} onPress={onPress} disabled testID="new"/>);
    if (isIOS) {
      const button = fab('new');
      expect(modifier(button.props, 'disabled')).toEqual({$type: 'disabled', disabled: true});
      expect(modifier(button.props, 'opacity')).toEqual({$type: 'opacity', value: 0.4});
    } else {
      const button = fab('new');
      expect(modifier(button.props, 'alpha')).toEqual({$type: 'alpha', alpha: 0.4});
      expect(button.props.onButtonPressed).toBeUndefined();
    }
  });

  (isIOS ? it.skip : it)('stands the label in for an icon without a drawable', async () => {
    await render(<Fab label="New" icon={{symbol: {android: 'add', web: 'add'}}} testID="new"/>);
    expect(nodes().some(n => n.type.endsWith('IconView'))).toBe(false);
    expect(host(p => p.slotName === 'icon').children).toContainEqual(host(p => p.text === 'N'));
  });

  it('opens a menu instead of pressing when given items', async () => {
    const onBlank = vi.fn();
    await render(
      <Fab label="New" icon={icons.add} items={[{...items[0], onPress: onBlank}, items[1]]} testID="new"/>,
    );
    if (isIOS) {
      const menu = fab('new');
      expect(menu.type).toContain('Menu');
      expect(menu.props.label).toBeUndefined();
      expect(modifier(menu.props, 'buttonStyle')?.style).toBe('plain');
      // The face is the menu's label slot; the entries are the kit's.
      const label = host(p => p.name === 'label');
      expect(host(p => !!modifier(p, 'frame'), label)).toBeTruthy();
      const entries = children(menu).filter(c => c.props.name !== 'label');
      expect(entries.map(e => e.props.label)).toEqual(['Blank document', 'Import files…']);
    } else {
      const dropdown = host(p => 'expanded' in p);
      expect(dropdown.props.expanded).toBe(false);
      expect(children(host(p => p.slotName === 'items')).map(e => host(p => typeof p.text === 'string', e).props.text))
        .toEqual(['Blank document', 'Import files…']);
      const [view] = screen.container.queryAll(i => typeof i.props.onButtonPressed === 'function');
      await fireEvent(view, 'buttonPressed');
      expect(host(p => 'expanded' in p).props.expanded).toBe(true);
      const [entry] = screen.container.queryAll(i => typeof i.props.onItemPressed === 'function');
      await fireEvent(entry, 'itemPressed');
      expect(onBlank).toHaveBeenCalledTimes(1);
      expect(host(p => 'expanded' in p).props.expanded).toBe(false);
      const [menu] = screen.container.queryAll(i => typeof i.props.onDismissRequest === 'function');
      await act(async () => {
        await fireEvent(menu, 'dismissRequest');
      });
      expect(host(p => 'expanded' in p).props.expanded).toBe(false);
    }
  });

  (isIOS ? it.skip : it)('carries no test identifier without a testID', async () => {
    await render(<Fab label="New" icon={icons.add}/>);
    expect(composeFab().props.modifiers).toEqual([]);
  });

  (isIOS ? it.skip : it)('does not open the menu while disabled', async () => {
    await render(<Fab label="New" icon={icons.add} items={items} disabled testID="new"/>);
    expect(fab('new').props.onButtonPressed).toBeUndefined();
    expect(host(p => 'expanded' in p).props.expanded).toBe(false);
  });
});
