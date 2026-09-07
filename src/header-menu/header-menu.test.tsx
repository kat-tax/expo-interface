import type {MenuItem} from '../menu/types';
import {Platform} from 'react-native';
import {render as renderDom, screen as dom} from '@testing-library/react';
import {render, screen} from '@testing-library/react-native';
import * as icons from '../__stories__/icons';
import {byComposeTestID, modifier, nodes} from '../__tests__/native';
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
    it('renders the plain small text menu trigger for a custom header', () => {
      renderDom(<HeaderMenu label="New…" icon={icons.add} items={items} testID="new"/>);
      const trigger = dom.getByRole('button', {name: 'New…'});
      expect(trigger).toHaveClass('ui-button--text', 'ui-button--small');
      expect(trigger).toHaveAttribute('data-testid', 'new');
      expect(dom.getAllByRole('menuitem', {hidden: true}).map(e => e.textContent)).toEqual(['Blank document', 'Import files…']);
      expect(document.querySelector('[style*="--expo-ui-primary-500"]')).toBeNull();
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

  it('mounts the small text menu trigger in its own host', async () => {
    await render(<HeaderMenu label="New…" icon={icons.add} items={items} testID="new"/>);
    const hostView = nodes().find(n => n.type === HOST)!;
    expect(hostView).toBeDefined();
    expect(hostView.props.matchContentsVertical ?? hostView.props.matchContents).toBeTruthy();
    const {props} = trigger('new');
    if (isIOS) {
      expect(props.label).toBe('New…');
      expect(props.systemImage).toBe('plus');
      expect(modifier(props, 'buttonStyle')?.style).toBe('plain');
      expect(modifier(props, 'controlSize')?.size).toBe('small');
      expect(modifier(props, 'tint')?.color).toBe('#007AFF');
    } else {
      expect(props.colors).toEqual({contentColor: '#007AFF'});
      expect(props.contentPadding).toEqual({start: 12, top: 6, end: 16, bottom: 6});
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
});
