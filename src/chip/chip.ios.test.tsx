import {render, screen} from '@testing-library/react-native';
import {modifier, nodes} from 'expo-vitest/native';
import * as icons from '../__stories__/icons';
import {Chip} from '.';

describe('Chip (ios)', () => {
  it('is a Toggle in button style when it has a state, so VoiceOver has one too', async () => {
    await render(<Chip label="Unread" selected onPress={() => {}} testID="c"/>);
    const {props} = screen.getByTestId('c');
    expect(props.isOn).toBe(true);
    expect(props.label).toBe('Unread');
    // The two that make it a chip rather than a switch.
    expect(modifier(props, 'toggleStyle')).toMatchObject({style: 'button'});
    expect(modifier(props, 'buttonBorderShape')).toBeDefined();
  });

  it('is a bordered capsule Button when it has none', async () => {
    await render(<Chip label="Add tag" onPress={() => {}} testID="c"/>);
    const {props} = screen.getByTestId('c');
    expect(props.isOn).toBeUndefined();
    expect(modifier(props, 'buttonStyle')).toMatchObject({style: 'bordered'});
    expect(modifier(props, 'buttonBorderShape')).toBeDefined();
  });

  it('reports the state the toggle moved to', async () => {
    const onPress = vi.fn();
    await render(<Chip label="Unread" selected={false} onPress={onPress} testID="c"/>);
    // The host hands the toggle's own event along; `@expo/ui` unwraps it.
    screen.getByTestId('c').props.onIsOnChange({nativeEvent: {isOn: true}});
    expect(onPress).toHaveBeenCalledWith(true);
  });

  it('presses an action chip, and survives having nobody to tell', async () => {
    const onPress = vi.fn();
    await render(<Chip label="Add tag" onPress={onPress} testID="c"/>);
    screen.getByTestId('c').props.onButtonPress({nativeEvent: {}});
    expect(onPress).toHaveBeenCalledWith(true);

    await render(<Chip label="Quiet" testID="quiet"/>);
    screen.getByTestId('quiet').props.onButtonPress({nativeEvent: {}});
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('carries a leading symbol, and dims when it is off', async () => {
    await render(<Chip label="Starred" icon={icons.add} disabled selected onPress={() => {}} testID="c"/>);
    const {props} = screen.getByTestId('c');
    expect(props.systemImage).toBeTruthy();
    expect(modifier(props, 'disabled')).toBeDefined();
    expect(nodes().length).toBeGreaterThan(0);
  });
});
