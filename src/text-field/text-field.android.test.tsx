import {fireEvent, render, screen} from '@testing-library/react-native';
import {byComposeTestID, host, nodes, modifier} from 'expo-vitest/native';
import {DialogTextField} from './index.android';

describe('DialogTextField (android)', () => {
  it("draws Material's outlined field, unshifted, with the row's placeholder colour, cursor tint and keyboard", async () => {
    const onSubmit = vi.fn();
    await render(
      <DialogTextField placeholder="Name" value="Essay" autoFocus autoCapitalize="words" autoCorrect={false} onSubmit={onSubmit} testID="name"/>,
    );
    const {props} = byComposeTestID('name');
    expect(props.variant).toBe('outlined');
    // Material's outline and container are its own: none of them is overridden. The text and the cursor are the kit's.
    expect(props.colors).toEqual({
      focusedTextColor: '#1D1B20FF',
      unfocusedTextColor: '#1D1B20FF',
      disabledTextColor: '#49454FFF',
      cursorColor: '#007AFF',
    });
    expect(props.autoFocus).toBe(true);
    expect(props.singleLine).toBe(true);
    expect(props.enabled).toBe(true);
    expect(props.textStyle).toEqual({fontSize: 16, color: '#1D1B20FF'});
    expect(props.keyboardOptions).toEqual({keyboardType: 'text', capitalization: 'words', autoCorrectEnabled: false, imeAction: 'done'});
    // The dialog's width, and no form inset to shift back by.
    expect(modifier(props, 'fillMaxWidth')).toBeDefined();
    expect(modifier(props, 'offset')).toBeUndefined();
    expect(host(p => p.text === 'Name').props.color).toBe('#9094A0');
    const [view] = screen.container.queryAll(i => typeof i.props.onKeyboardAction === 'function');
    await fireEvent(view, 'keyboardAction', {nativeEvent: {action: 'done', value: 'Essay'}});
    expect(onSubmit).toHaveBeenCalledWith('Essay');
  });

  it('takes the accent colour for the cursor, masks secure entry and shows no placeholder slot without one', async () => {
    await render(<DialogTextField secureTextEntry keyboardType="number" accentColor="#FF9500" disabled testID="pin"/>);
    const {props} = byComposeTestID('pin');
    expect(props.variant).toBe('outlined');
    expect(props.colors.cursorColor).toBe('#FF9500');
    expect(props.visualTransformation).toBe('password');
    expect(props.keyboardOptions).toEqual({keyboardType: 'numberPassword', imeAction: 'default'});
    expect(props.enabled).toBe(false);
    expect(nodes().some(n => n.props.slotName === 'placeholder')).toBe(false);
  });
});
