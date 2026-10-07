import {Platform} from 'react-native';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import * as icons from '../__stories__/icons';
import {byComposeTestID, modifier} from 'expo-vitest/native';
import {NativeHostContext} from '../host';
import {Button} from '.';

const isIOS = Platform.OS === 'ios';
const button = (testID: string) => isIOS ? screen.getByTestId(testID) : byComposeTestID(testID);
const options = {wrapper: ({children}: React.PropsWithChildren) => <NativeHostContext.Provider value={true}>{children}</NativeHostContext.Provider>};

describe(`Button pressed (${Platform.OS})`, () => {
  it('draws a toggle that is on filled, whatever its variant, and says it is on', async () => {
    const onPress = vi.fn();
    await render(
      <>
        <Button label="Bold" prefixIcon={icons.add} hideLabel variant="text" pressed onPress={onPress} testID="on"/>
        <Button label="Italic" prefixIcon={icons.star} hideLabel variant="text" pressed={false} testID="off"/>
        <Button label="Plain" prefixIcon={icons.share} hideLabel variant="text" testID="plain"/>
      </>,
      options,
    );
    if (isIOS) {
      expect(modifier(button('on').props, 'buttonStyle')?.style).toBe('borderedProminent');
      expect(modifier(button('on').props, 'accessibilityAddTraits')?.traits).toEqual(['isSelected']);
      expect(modifier(button('off').props, 'buttonStyle')?.style).toBe('plain');
      expect(modifier(button('off').props, 'accessibilityAddTraits')).toBeUndefined();
      await fireEvent.press(screen.getByTestId('on'));
    } else {
      // Material's icon toggle button: the checked state is in the semantics tree.
      expect(button('on').props.checked).toBe(true);
      expect(button('off').props.checked).toBe(false);
      expect(button('off').props.colors).toMatchObject({containerColor: '#00000000', checkedContainerColor: '#007AFF'});
      // A button that is not a toggle stays the plain icon button.
      expect('checked' in button('plain').props).toBe(false);
      await act(async () => {
        button('on').props.onCheckedChange({nativeEvent: {checked: false}});
      });
    }
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  (isIOS ? it.skip : it)('makes a labelled toggle Material\'s toggle button, filled while off for a filled variant', async () => {
    const onPress = vi.fn();
    await render(<Button label="Live" variant="filled" pressed={false} onPress={onPress} testID="live"/>, options);
    expect(button('live').props.checked).toBe(false);
    expect(button('live').props.colors).toMatchObject({containerColor: '#007AFF', contentColor: '#FFFFFF'});
    expect(button('live').props.enabled).toBe(true);
    await act(async () => {
      button('live').props.onCheckedChange({nativeEvent: {checked: true}});
    });
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  (isIOS ? it.skip : it)('takes no press on a disabled or busy toggle, and needs no handler', async () => {
    await render(
      <>
        <Button label="Bold" prefixIcon={icons.add} hideLabel variant="text" pressed disabled testID="disabled"/>
        <Button label="Live" pressed={false} testID="bare"/>
      </>,
      options,
    );
    expect(button('disabled').props.enabled).toBe(false);
    await act(async () => {
      button('bare').props.onCheckedChange({nativeEvent: {checked: true}});
    });
    expect(button('bare').props.checked).toBe(false);
  });

  (isIOS ? it.skip : it)('makes an inline toggle a toggleable row, which TalkBack hears as on or off', async () => {
    const onPress = vi.fn();
    await render(
      <>
        <Button label="Bold" prefixIcon={icons.add} hideLabel size="inline" pressed onPress={onPress} testID="inline"/>
        <Button label="Plain" prefixIcon={icons.add} hideLabel size="inline" onPress={onPress} testID="click"/>
        <Button label="Idle" prefixIcon={icons.add} hideLabel size="inline" pressed testID="idle"/>
      </>,
      options,
    );
    const toggle = modifier(button('inline').props, 'toggleable');
    expect(toggle).toMatchObject({value: true});
    await act(async () => toggle!.eventListener());
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(modifier(button('click').props, 'clickable')).toBeDefined();
    expect(modifier(button('idle').props, 'toggleable')).toBeUndefined();
    expect(modifier(button('idle').props, 'clickable')).toBeUndefined();
  });
});
