import type {MenuItem} from '../menu/types';
import {Platform} from 'react-native';
import {fireEvent as fireDom, render as renderDom, screen as dom} from '@testing-library/react';
import {render, screen} from '@testing-library/react-native';
import * as icons from '../__stories__/icons';
import {byComposeTestID, nodes} from '../__tests__/native';
import {HeaderAction} from '../header-action';
import {HeaderMenu} from '../header-menu';
import {HeaderActions} from '.';

vi.mock('expo-router', async importOriginal => {
  const router = await importOriginal<typeof import('expo-router')>();
  return {...router, useIsFocused: () => true};
});

const HOST = 'ViewManagerAdapter_ExpoUI_HostView';
const items: MenuItem[] = [{label: 'PDF'}, {label: 'Markdown'}];

describe(`HeaderActions (${Platform.OS})`, () => {
  if (Platform.OS === 'web') {
    it('lays the actions out in a row with space between them', () => {
      renderDom(
        <HeaderActions testID="actions">
          <HeaderAction label="Copy" icon={icons.share} onPress={vi.fn()} hideLabel/>
          <HeaderMenu label="Export" icon={icons.add} items={items} hideLabel/>
        </HeaderActions>,
      );
      const row = dom.getByTestId('actions');
      const style = getComputedStyle(row);
      expect(style.display).toBe('flex');
      expect(style.flexDirection).toBe('row');
      expect(style.alignItems).toBe('center');
      // An icon button in the bar is a 30px box around an 18px glyph, so two
      // of them abutting leave 12px between the glyphs and read as one.
      expect(style.gap).toBe('8px');
      expect(dom.getByRole('button', {name: 'Copy'})).toBeInTheDocument();
      expect(dom.getByRole('button', {name: 'Export'})).toBeInTheDocument();
    });

    it('keeps each action working', () => {
      const onPress = vi.fn();
      renderDom(
        <HeaderActions>
          <HeaderAction label="Copy" onPress={onPress}/>
        </HeaderActions>,
      );
      fireDom.click(dom.getByRole('button', {name: 'Copy'}));
      expect(onPress).toHaveBeenCalledTimes(1);
    });
    return;
  }

  const isIOS = Platform.OS === 'ios';
  const row = () => isIOS ? screen.getByTestId('actions').props : byComposeTestID('actions').props;

  const renderRow = () => render(
    <HeaderActions testID="actions">
      <HeaderAction label="Copy" icon={icons.share} onPress={vi.fn()} hideLabel testID="copy"/>
      <HeaderMenu label="Export" icon={icons.add} items={items} hideLabel testID="export"/>
    </HeaderActions>,
  );

  it('hosts the whole row once, so its children mount no host of their own', async () => {
    await renderRow();
    // Three side by side would otherwise be three `@expo/ui` hosts in one header.
    expect(nodes().filter(n => n.type === HOST)).toHaveLength(1);
    expect(isIOS ? screen.getByTestId('copy') : byComposeTestID('copy')).toBeTruthy();
    expect(isIOS ? screen.getByTestId('export') : byComposeTestID('export')).toBeTruthy();
  });

  it('spaces the actions the way the platform spaces its own', async () => {
    await renderRow();
    const props = row();
    if (isIOS) {
      // A plain SwiftUI button is exactly its symbol; the space is the bar's.
      expect(props.spacing).toBe(16);
    } else {
      // Material's icon buttons carry their own 48dp container, which is the
      // app bar's action pitch — a gap here would push them past it.
      expect(props.horizontalArrangement).toEqual({spacedBy: 0});
    }
  });

  it('centres the actions across the header', async () => {
    await renderRow();
    const props = row();
    expect(isIOS ? props.alignment : props.verticalAlignment).toBe('center');
  });
});
