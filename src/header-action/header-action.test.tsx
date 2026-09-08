import {Platform} from 'react-native';
import {fireEvent as fireDom, render as renderDom, screen as dom} from '@testing-library/react';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import * as icons from '../__stories__/icons';
import {InBarContext} from '../tabs/context';
import {byComposeTestID, host, modifier, nodes} from '../__tests__/native';
import {HeaderAction} from '.';

/** The screen's focus, as the navigator would report it. */
const focus = {value: true};
vi.mock('expo-router', async importOriginal => {
  const router = await importOriginal<typeof import('expo-router')>();
  return {...router, useIsFocused: () => focus.value};
});

const HOST = 'ViewManagerAdapter_ExpoUI_HostView';

describe(`HeaderAction (${Platform.OS})`, () => {
  afterEach(() => {
    focus.value = true;
  });

  if (Platform.OS === 'web') {
    it('renders the header-sized text button and reports the press', () => {
      const onPress = vi.fn();
      renderDom(<HeaderAction label="Copy" icon={icons.share} onPress={onPress} testID="copy"/>);
      const trigger = dom.getByRole('button', {name: 'Copy'});
      expect(trigger).toHaveClass('ui-button--text', 'ui-button--medium');
      expect(trigger).toHaveAttribute('data-testid', 'copy');
      // No menu comes with it: this is the trigger on its own.
      expect(dom.queryByRole('menu', {hidden: true})).toBeNull();
      fireDom.click(trigger);
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('drops to the bar size when it is folded into the web tab bar', () => {
      renderDom(
        <InBarContext.Provider value={true}>
          <HeaderAction label="Copy" icon={icons.share} onPress={vi.fn()}/>
        </InBarContext.Provider>,
      );
      // The bar is the height of its tabs; a header-sized button would grow it.
      const trigger = dom.getByRole('button', {name: 'Copy'});
      expect(trigger).toHaveClass('ui-button--small');
      expect(trigger).not.toHaveClass('ui-button--medium');
    });

    it('takes the label tone, hides the label and does not press while disabled', () => {
      const onPress = vi.fn();
      renderDom(<HeaderAction label="Copy" icon={icons.share} onPress={onPress} tone="label" hideLabel disabled/>);
      const trigger = dom.getByRole('button', {name: 'Copy'});
      expect(trigger).toHaveClass('ui-button--label', 'ui-button--icon-only');
      expect((trigger as HTMLButtonElement).disabled).toBe(true);
      fireDom.click(trigger);
      expect(onPress).not.toHaveBeenCalled();
    });
    return;
  }

  const isIOS = Platform.OS === 'ios';
  const trigger = (testID: string) => isIOS ? screen.getByTestId(testID) : byComposeTestID(testID);

  it('mounts the header-sized text button in its own host', async () => {
    await render(<HeaderAction label="Copy" icon={icons.share} onPress={vi.fn()} testID="copy"/>);
    const hostView = nodes().find(n => n.type === HOST)!;
    expect(hostView).toBeDefined();
    expect(hostView.props.matchContentsVertical ?? hostView.props.matchContents).toBeTruthy();
    const {props} = trigger('copy');
    if (isIOS) {
      expect(props.label).toBe('Copy');
      expect(props.systemImage).toBe('square.and.arrow.up');
      expect(modifier(props, 'buttonStyle')?.style).toBe('plain');
      // 17pt text, the size of a bar button's title.
      expect(modifier(props, 'controlSize')?.size).toBe('large');
      expect(modifier(props, 'tint')?.color).toBe('#007AFF');
    } else {
      expect(props.colors).toEqual({contentColor: '#007AFF'});
      // A 24dp icon, not the button size's 18.
      expect(nodes().some(n => n.props.size === 24 && n.props.tint === '#007AFF')).toBe(true);
    }
  });

  it('draws the icon at the header size when the label is hidden', async () => {
    await render(<HeaderAction label="Copy" icon={icons.share} onPress={vi.fn()} hideLabel testID="copy"/>);
    const {props} = trigger('copy');
    if (isIOS) {
      // A sized symbol has to be the button's label view: `systemImage` would
      // take the control size instead.
      expect(props.systemImage).toBeUndefined();
      expect(modifier(props, 'accessibilityLabel')?.label).toBe('Copy');
      const image = host(p => p.systemName === 'square.and.arrow.up');
      expect(modifier(image.props, 'font')?.size).toBe(22);
    } else {
      expect(nodes().some(n => n.props.size === 24 && n.props.contentDescription === 'Copy')).toBe(true);
    }
  });

  it('reports the press', async () => {
    const onPress = vi.fn();
    await render(<HeaderAction label="Copy" onPress={onPress} testID="copy"/>);
    if (isIOS) {
      await fireEvent.press(screen.getByTestId('copy'));
    } else {
      await act(async () => {
        byComposeTestID('copy').props.onButtonPressed();
      });
    }
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('takes the label tone and does not press while disabled', async () => {
    const onPress = vi.fn();
    await render(<HeaderAction label="Copy" onPress={onPress} tone="label" disabled testID="copy"/>);
    const {props} = trigger('copy');
    if (isIOS) {
      expect(modifier(props, 'tint')?.color).toBe('#000000');
      expect(modifier(props, 'disabled')).toEqual({$type: 'disabled', disabled: true});
    } else {
      expect(props.colors).toEqual({contentColor: '#000000'});
      expect(props.enabled).toBe(false);
      // The Compose view is handed no press handler at all, so there is
      // nothing for a press on it to reach.
      expect(props.onButtonPressed).toBeUndefined();
    }
    expect(onPress).not.toHaveBeenCalled();
  });

  (isIOS ? it.skip : it)('rebuilds the host when the screen loses and regains focus', async () => {
    const {rerender} = await render(<HeaderAction label="Copy" onPress={vi.fn()} testID="copy"/>);
    expect(nodes().filter(n => n.type === HOST)).toHaveLength(1);
    focus.value = false;
    await rerender(<HeaderAction label="Copy" onPress={vi.fn()} testID="copy"/>);
    expect(nodes().filter(n => n.type === HOST)).toHaveLength(1);
    expect(trigger('copy')).toBeTruthy();
  });
});
