import {Platform} from 'react-native';
import {fireEvent, render, screen} from '@testing-library/react-native';
import {AccentProvider} from '../accent';
import {byComposeTestID, host, modifier} from '../__tests__/native';
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

  (isIOS ? it : it.skip)('calls onPress', async () => {
    const onPress = vi.fn();
    await render(<Button label="Save" onPress={onPress} testID="save"/>);
    await fireEvent.press(screen.getByTestId('save'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
