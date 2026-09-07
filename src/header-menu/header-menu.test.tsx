import type {MenuItem} from '../menu/types';
import {Platform} from 'react-native';
import {render as renderDom, screen as dom} from '@testing-library/react';
import {act, render, screen} from '@testing-library/react-native';
import * as icons from '../__stories__/icons';
import {InBarContext} from '../tabs/context';
import {byComposeTestID, host, modifier, nodes} from '../__tests__/native';
import {HeaderMenu} from '.';

/** The screen's focus, as the navigator would report it. */
const focus = {value: true};
vi.mock('expo-router', async importOriginal => {
  const router = await importOriginal<typeof import('expo-router')>();
  return {...router, useIsFocused: () => focus.value};
});

const HOST = 'ViewManagerAdapter_ExpoUI_HostView';
const items: MenuItem[] = [
  {label: 'Blank document', icon: icons.add},
  {label: 'Import files…', icon: icons.share},
];

describe(`HeaderMenu (${Platform.OS})`, () => {
  afterEach(() => {
    focus.value = true;
  });

  if (Platform.OS === 'web') {
    it('renders the plain header-sized text menu trigger for a custom header', () => {
      renderDom(<HeaderMenu label="New…" icon={icons.add} items={items} testID="new"/>);
      const trigger = dom.getByRole('button', {name: 'New…'});
      expect(trigger).toHaveClass('ui-button--text', 'ui-button--medium');
      expect(trigger).toHaveAttribute('data-testid', 'new');
      expect(dom.getAllByRole('menuitem', {hidden: true})
        .map(e => e.querySelector('.ui-menu__label')?.textContent))
        .toEqual(['Blank document', 'Import files…']);
      expect(document.querySelector('[style*="--expo-ui-primary-500"]')).toBeNull();
    });

    it('drops to the bar size when it is folded into the web tab bar', () => {
      renderDom(
        <InBarContext.Provider value={true}>
          <HeaderMenu label="New…" icon={icons.add} items={items}/>
        </InBarContext.Provider>,
      );
      const trigger = dom.getByRole('button', {name: 'New…'});
      // The bar is the height of its tabs; a header-sized button would grow it.
      expect(trigger).toHaveClass('ui-button--small');
      expect(trigger).not.toHaveClass('ui-button--medium');
    });

    it('takes the label tone, hides the label and disables', () => {
      renderDom(<HeaderMenu label="New" icon={icons.add} items={items} tone="label" hideLabel disabled/>);
      const trigger = dom.getByRole('button', {name: 'New'});
      expect(trigger).toHaveClass('ui-button--label', 'ui-button--icon-only');
      expect((trigger as HTMLButtonElement).disabled).toBe(true);
    });
    return;
  }

  const isIOS = Platform.OS === 'ios';
  const trigger = (testID: string) => isIOS ? screen.getByTestId(testID) : byComposeTestID(testID);

  it('mounts the header-sized text menu trigger in its own host', async () => {
    await render(<HeaderMenu label="New…" icon={icons.add} items={items} testID="new"/>);
    const hostView = nodes().find(n => n.type === HOST)!;
    expect(hostView).toBeDefined();
    expect(hostView.props.matchContentsVertical ?? hostView.props.matchContents).toBeTruthy();
    const {props} = trigger('new');
    if (isIOS) {
      expect(props.label).toBe('New…');
      expect(props.systemImage).toBe('plus');
      expect(modifier(props, 'buttonStyle')?.style).toBe('plain');
      // 17pt text, the size of a bar button's title.
      expect(modifier(props, 'controlSize')?.size).toBe('large');
      expect(modifier(props, 'tint')?.color).toBe('#007AFF');
    } else {
      expect(props.colors).toEqual({contentColor: '#007AFF'});
      expect(props.contentPadding).toEqual({start: 16, top: 10, end: 24, bottom: 10});
      // A 24dp icon, not the button size's 18.
      expect(nodes().some(n => n.props.size === 24 && n.props.tint === '#007AFF')).toBe(true);
    }
  });

  it('draws the icon at the header size when the label is hidden', async () => {
    await render(<HeaderMenu label="New…" icon={icons.add} items={items} hideLabel testID="new"/>);
    const {props} = trigger('new');
    if (isIOS) {
      // A sized symbol has to be the menu's label view: `systemImage` would
      // take the control size instead.
      expect(props.systemImage).toBeUndefined();
      expect(modifier(props, 'accessibilityLabel')?.label).toBe('New…');
      const image = host(p => p.systemName === 'plus');
      expect(modifier(image.props, 'font')?.size).toBe(22);
    } else {
      expect(nodes().some(n => n.props.size === 24 && n.props.contentDescription === 'New…')).toBe(true);
    }
  });

  it('takes the label tone and disables', async () => {
    await render(<HeaderMenu label="New…" items={items} tone="label" disabled testID="new"/>);
    const {props} = trigger('new');
    if (isIOS) {
      expect(modifier(props, 'tint')?.color).toBe('#000000');
      expect(modifier(props, 'disabled')).toEqual({$type: 'disabled', disabled: true});
    } else {
      expect(props.colors).toEqual({contentColor: '#000000'});
      expect(props.enabled).toBe(false);
    }
  });

  (isIOS ? it.skip : it)('rebuilds the host when the screen loses and regains focus', async () => {
    const {rerender} = await render(<HeaderMenu label="New…" items={items} testID="new"/>);
    expect(nodes().filter(n => n.type === HOST)).toHaveLength(1);
    focus.value = false;
    await rerender(<HeaderMenu label="New…" items={items} testID="new"/>);
    expect(nodes().filter(n => n.type === HOST)).toHaveLength(1);
    expect(trigger('new')).toBeTruthy();
    focus.value = true;
    await rerender(<HeaderMenu label="New…" items={items} testID="new"/>);
    expect(trigger('new')).toBeTruthy();
  });

  (isIOS ? it.skip : it)('gives the host the size Compose measured, so the toolbar lays it out', async () => {
    await render(<HeaderMenu label="New…" items={items} testID="new"/>);
    // `fit` hosts carry no style of their own until one is measured.
    const hostView = () => nodes().find(n => n.type === HOST)!;
    const style = () => (hostView().props.style as unknown[])[1];
    expect(style()).toBeUndefined();
    await act(async () => {
      hostView().props.onLayoutContent({nativeEvent: {width: 96, height: 48}});
    });
    expect(style()).toEqual({width: 96, height: 48});
    // The same size again is not a new state.
    const before = style();
    await act(async () => {
      hostView().props.onLayoutContent({nativeEvent: {width: 96, height: 48}});
    });
    expect(style()).toBe(before);
  });
});
