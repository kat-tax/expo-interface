import {Platform} from 'react-native';
import {fireEvent, render, screen} from '@testing-library/react-native';
import {AccentProvider} from '../accent';
import * as icons from '../__stories__/icons';
import {byComposeTestID, host, modifier, nodes} from '../__tests__/native';
import {Button} from '.';

const isIOS = Platform.OS === 'ios';
const button = (testID: string) => isIOS ? screen.getByTestId(testID) : byComposeTestID(testID);

describe(`Button (${Platform.OS})`, () => {
  it('renders the native button with its label', async () => {
    await render(<Button label="Continue" testID="cta"/>);
    const {props} = button('cta');
    if (isIOS) {
      expect(props.label).toBe('Continue');
      expect(modifier(props, 'buttonStyle')).toEqual({$type: 'buttonStyle', style: 'borderedProminent'});
      expect(modifier(props, 'controlSize')).toEqual({$type: 'controlSize', size: 'regular'});
    } else {
      expect(host(p => p.text === 'Continue')).toBeTruthy();
      expect(props.enabled).toBe(true);
    }
  });

  it('brands the button with the accent seed', async () => {
    await render(
      <AccentProvider seed="#8959EA">
        <Button label="Go" testID="go"/>
      </AccentProvider>,
    );
    const {props} = button('go');
    if (isIOS) {
      expect(modifier(props, 'tint')).toEqual({$type: 'tint', color: '#8959EA'});
    } else {
      expect(props.colors).toEqual({containerColor: '#8959EA', contentColor: '#FFFFFF'});
    }
  });

  it('uses the destructive color for the destructive role', async () => {
    await render(<Button label="Delete" role="destructive" variant="text" testID="del"/>);
    const {props} = button('del');
    if (isIOS) {
      expect(props.role).toBe('destructive');
      expect(modifier(props, 'tint')?.color).toBe('#FF3B30');
      expect(modifier(props, 'buttonStyle')?.style).toBe('plain');
    } else {
      expect(props.colors).toEqual({contentColor: '#FF3B30'});
    }
  });

  it('maps size and shape to native modifiers', async () => {
    await render(<Button label="Big" size="large" shape="circle" testID="big"/>);
    const {props} = button('big');
    if (isIOS) {
      expect(modifier(props, 'controlSize')?.size).toBe('large');
      expect(modifier(props, 'buttonBorderShape')?.shape).toBe('circle');
    } else {
      expect(props.shape).toBeDefined();
      expect(props.contentPadding).toEqual({start: 28, top: 14, end: 28, bottom: 14});
    }
  });

  it('disables the control', async () => {
    const onPress = vi.fn();
    await render(<Button label="Save" disabled onPress={onPress} testID="save"/>);
    const {props} = button('save');
    if (isIOS) {
      expect(modifier(props, 'disabled')).toEqual({$type: 'disabled', disabled: true});
    } else {
      expect(props.enabled).toBe(false);
      expect(props.onClick).toBeUndefined();
    }
  });

  it('hugs its content unless fillWidth is set', async () => {
    await render(<Button label="Go" testID="hug"/>);
    const {props} = button('hug');
    if (isIOS) {
      expect(props.label).toBe('Go');
      expect(() => host(p => !!modifier(p, 'frame'))).toThrow();
    } else {
      expect(modifier(props, 'wrapContentWidth')).toEqual({$type: 'wrapContentWidth', alignment: 'start'});
      expect(modifier(props, 'wrapContentHeight')).toEqual({$type: 'wrapContentHeight', alignment: 'top'});
      expect(modifier(props, 'fillMaxWidth')).toBeUndefined();
    }
  });

  it('fills the width on request', async () => {
    await render(<Button label="Go" fillWidth testID="fill"/>);
    const {props} = button('fill');
    if (isIOS) {
      // The frame goes on the composed label so the bordered style fills too.
      expect(props.label).toBeUndefined();
      expect(modifier(host(p => !!modifier(p, 'frame')).props, 'frame')?.maxWidth).toBeGreaterThan(0);
    } else {
      expect(modifier(props, 'fillMaxWidth')).toBeDefined();
      expect(modifier(props, 'wrapContentWidth')).toBeUndefined();
    }
  });

  (isIOS ? it : it.skip)('calls onPress', async () => {
    const onPress = vi.fn();
    await render(<Button label="Save" onPress={onPress} testID="save"/>);
    await fireEvent.press(screen.getByTestId('save'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders a leading icon beside the label', async () => {
    await render(<Button label="Share" prefixIcon={icons.share} testID="share"/>);
    const {props} = button('share');
    if (isIOS) {
      expect(props.label).toBe('Share');
      expect(props.systemImage).toBe('square.and.arrow.up');
      expect(modifier(props, 'labelStyle')).toBeUndefined();
    } else {
      const icon = host(p => p.tint != null && p.size === 18);
      expect(icon.props.tint).toBe('#FFFFFF');
      expect(host(p => modifier(p, 'width')?.width === 8)).toBeTruthy();
      expect(host(p => p.text === 'Share')).toBeTruthy();
      expect(props.contentPadding).toEqual({start: 16, top: 10, end: 24, bottom: 10});
    }
  });

  it('composes the label by hand for a trailing icon', async () => {
    await render(
      <Button
        label="Delete"
        variant="outlined"
        role="destructive"
        prefixIcon={icons.share}
        suffixIcon={icons.trash}
        testID="del"
      />,
    );
    const {props} = button('del');
    if (isIOS) {
      expect(props.label).toBeUndefined();
      expect(props.role).toBe('destructive');
      const stack = host(p => p.spacing === 8);
      expect(modifier(stack.props, 'frame')).toBeUndefined();
      const symbols = nodes(stack).filter(n => typeof n.props.systemName === 'string');
      expect(symbols.map(n => n.props.systemName)).toEqual(['square.and.arrow.up', 'trash']);
      expect(symbols.map(n => modifier(n.props, 'foregroundStyle')?.color)).toEqual(['#FF3B30', '#FF3B30']);
      expect(host(p => p.text === 'Delete', stack)).toBeTruthy();
    } else {
      const drawables = nodes().filter(n => n.type.endsWith('IconView'));
      expect(drawables).toHaveLength(2);
      expect(drawables.map(n => n.props.tint)).toEqual(['#FF3B30', '#FF3B30']);
      expect(nodes().filter(n => modifier(n.props, 'width')?.width === 8)).toHaveLength(2);
      expect(host(p => p.text === 'Delete')).toBeTruthy();
    }
  });

  it('drops the label and trailing icon in icon-only mode', async () => {
    await render(<Button label="Share" prefixIcon={icons.share} suffixIcon={icons.trash} hideLabel testID="share"/>);
    const {props} = button('share');
    if (isIOS) {
      expect(props.label).toBe('Share');
      expect(props.systemImage).toBe('square.and.arrow.up');
      expect(modifier(props, 'labelStyle')).toEqual({$type: 'labelStyle', style: 'iconOnly'});
      expect(nodes().some(n => n.props.spacing === 8)).toBe(false);
    } else {
      const icon = host(p => p.contentDescription === 'Share');
      expect(icon.props.tint).toBe('#FFFFFF');
      expect(nodes().filter(n => n.type.endsWith('IconView'))).toHaveLength(1);
      expect(nodes().some(n => typeof n.props.text === 'string')).toBe(false);
    }
  });

  it('keeps the label when hideLabel has no icon to show instead', async () => {
    await render(<Button label="Plain" hideLabel testID="plain"/>);
    const {props} = button('plain');
    if (isIOS) {
      expect(props.label).toBe('Plain');
      expect(modifier(props, 'labelStyle')).toBeUndefined();
    } else {
      expect(host(p => p.text === 'Plain')).toBeTruthy();
    }
  });

  it('applies a custom accent with its own contrast color', async () => {
    await render(<Button label="Go" color="#FFCC00" testID="go"/>);
    const {props} = button('go');
    if (isIOS) {
      expect(modifier(props, 'tint')).toEqual({$type: 'tint', color: '#FFCC00'});
    } else {
      expect(props.colors).toEqual({containerColor: '#FFCC00', contentColor: '#000000'});
    }
  });

  (isIOS ? it.skip : it)('maps the rounded and pill shapes', async () => {
    await render(
      <>
        <Button label="R" shape="rounded" testID="rounded"/>
        <Button label="P" shape="pill" testID="pill"/>
      </>,
    );
    expect(button('rounded').props.shape).toMatchObject({type: 'roundedCorner'});
    expect(button('pill').props.shape).toMatchObject({type: 'pill'});
  });

  (isIOS ? it.skip : it)('disables the icon-only button', async () => {
    await render(<Button label="Share" prefixIcon={icons.share} hideLabel disabled testID="share"/>);
    const {props} = button('share');
    expect(props.enabled).toBe(false);
    expect(props.onClick).toBeUndefined();
  });
});
