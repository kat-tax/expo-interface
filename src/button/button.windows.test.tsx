import {Platform} from 'react-native';
import {fireEvent, render, screen} from '@testing-library/react-native';
import {AccentProvider} from '../accent';
import * as icons from '../__stories__/icons';
import {host} from '../__tests__/native';
import {Button} from '.';

const button = (testID: string) => host(p => p.testID === testID);

describe(`Button (${Platform.OS})`, () => {
  it('is Windows here', () => {
    expect(Platform.OS).toBe('windows');
  });

  it('renders the XAML button island with its label and the Fluent defaults', async () => {
    await render(<Button label="Continue" testID="cta"/>);
    const {type, props} = button('cta');
    expect(type).toBe('ExpoInterfaceButton');
    expect(props.label).toBe('Continue');
    expect(props.variant).toBe('filled');
    expect(props.buttonRole).toBe('default');
    expect(props.size).toBe('medium');
    expect(props.shape).toBe('default');
    expect(props.theme).toBe('light');
    expect(props.accentColor).toBe('#007AFF');
    expect(props.iconOnly).toBe(false);
  });

  it('calls onPress from the island event', async () => {
    const onPress = vi.fn();
    await render(<Button label="Save" onPress={onPress} testID="save"/>);
    await fireEvent(screen.getByTestId('save'), 'press');
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('draws the icons as Segoe Fluent Icons glyphs', async () => {
    await render(<Button label="Share" prefixIcon={icons.share} suffixIcon={icons.trash} testID="share"/>);
    const {props} = button('share');
    expect(props.glyph).toBe('E72D');
    expect(props.glyphAfter).toBe('E74D');
    expect(props.glyphSize).toBe(18);
  });

  it('drops the label and trailing glyph in icon-only mode', async () => {
    await render(<Button label="Share" prefixIcon={icons.share} suffixIcon={icons.trash} hideLabel testID="share"/>);
    const {props} = button('share');
    expect(props.iconOnly).toBe(true);
    expect(props.label).toBe('Share');
    expect(props.glyphAfter).toBeUndefined();
  });

  it('keeps the label when hideLabel has no glyph to show instead', async () => {
    await render(<Button label="Plain" hideLabel testID="plain"/>);
    expect(button('plain').props.iconOnly).toBe(false);
  });

  it('brands the button with the accent seed and an explicit color', async () => {
    await render(
      <AccentProvider seed="#8959EA">
        <Button label="Go" testID="go"/>
        <Button label="Custom" color="#FFCC00" testID="custom"/>
      </AccentProvider>,
    );
    expect(button('go').props.accentColor).toBe('#8959EA');
    expect(button('custom').props.color).toBe('#FFCC00');
  });

  it('maps role, tone, size, shape, icon size and disabled', async () => {
    await render(
      <Button
        label="Delete"
        role="destructive"
        variant="text"
        tone="label"
        size="large"
        shape="circle"
        iconSize={24}
        prefixIcon={icons.add}
        disabled
        testID="del"
      />,
    );
    const {props} = button('del');
    expect(props.buttonRole).toBe('destructive');
    expect(props.variant).toBe('text');
    expect(props.tone).toBe('label');
    expect(props.size).toBe('large');
    expect(props.shape).toBe('circle');
    expect(props.glyphSize).toBe(24);
    expect(props.disabled).toBe(true);
  });

  it('hugs its content unless fillWidth is set', async () => {
    await render(
      <>
        <Button label="Hug" testID="hug"/>
        <Button label="Fill" fillWidth testID="fill"/>
      </>,
    );
    expect(button('hug').props.style).toEqual({alignSelf: 'flex-start'});
    expect(button('hug').props.fillWidth).toBe(false);
    expect(button('fill').props.style).toEqual({alignSelf: 'stretch'});
    expect(button('fill').props.fillWidth).toBe(true);
  });
});
