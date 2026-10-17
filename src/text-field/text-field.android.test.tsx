import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {byComposeTestID, host, nodes, modifier} from 'expo-vitest/native';
import {DialogTextField, TextField} from './index.android';

/**
 * The filled Compose field with a probe around it, which counts the fields
 * mounted and keeps each text state handed over, so a test can tell a new
 * field from the same one and see which state it was given.
 */
const fields = vi.hoisted(() => ({mounted: 0, values: [] as unknown[]}));
vi.mock('@expo/ui/jetpack-compose', async importOriginal => {
  const compose = await importOriginal<typeof import('@expo/ui/jetpack-compose')>();
  const {useEffect} = await import('react');
  function TextFieldProbe(props: Parameters<typeof compose.TextField>[0]) {
    fields.values.push(props.value);
    useEffect(() => {
      fields.mounted += 1;
    }, []);
    return <compose.TextField {...props}/>;
  }
  return {...compose, TextField: Object.assign(TextFieldProbe, compose.TextField)};
});

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
    // A plain field carries no description: Compose would read it in place of the text.
    expect(modifier(props, 'semantics')).toBeUndefined();
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
    expect(modifier(props, 'semantics')).toBeUndefined();
  });
});

describe('TextField (android)', () => {
  it('names a password field by its placeholder, which stays its name once the field holds text', async () => {
    await render(<TextField placeholder="Password" value="hunter22" secureTextEntry testID="password"/>);
    const {props} = byComposeTestID('password');
    // Material draws and reports the placeholder slot only while the field is empty; the description stays.
    expect(host(p => p.slotName === 'placeholder')).toBeTruthy();
    expect(modifier(props, 'semantics')).toEqual({$type: 'semantics', contentDescription: 'Password'});
  });

  it('leaves an empty password field to its placeholder, and describes it once it holds text', async () => {
    const onChangeText = vi.fn();
    await render(<TextField placeholder="Password" secureTextEntry onChangeText={onChangeText} testID="pw"/>);
    const description = () => modifier(byComposeTestID('pw').props, 'semantics');
    // Empty, the placeholder names it: a description as well would name it twice.
    expect(description()).toBeUndefined();
    await act(async () => byComposeTestID('pw').props.onValueChange({nativeEvent: {text: 'h'}}));
    expect(onChangeText).toHaveBeenLastCalledWith('h');
    expect(description()).toEqual({$type: 'semantics', contentDescription: 'Password'});
    await act(async () => byComposeTestID('pw').props.onValueChange({nativeEvent: {text: ''}}));
    expect(description()).toBeUndefined();
    // A controlled field follows its value, and takes no change handler to.
    await render(<TextField placeholder="PIN" value="" secureTextEntry testID="pin"/>);
    expect(modifier(byComposeTestID('pin').props, 'semantics')).toBeUndefined();
    await act(async () => byComposeTestID('pin').props.onValueChange({nativeEvent: {text: '1'}}));
    expect(modifier(byComposeTestID('pin').props, 'semantics')).toBeUndefined();
  });

  it('describes no plain field, and no password field without a placeholder or with an empty one', async () => {
    // TalkBack would move through a plain field's description in place of its text.
    await render(<TextField placeholder="Email" value="ada@example.com" testID="email"/>);
    expect(modifier(byComposeTestID('email').props, 'semantics')).toBeUndefined();
    await render(<TextField value="Ada" secureTextEntry testID="none"/>);
    expect(modifier(byComposeTestID('none').props, 'semantics')).toBeUndefined();
    await render(<TextField placeholder="" value="Ada" secureTextEntry testID="empty"/>);
    expect(modifier(byComposeTestID('empty').props, 'semantics')).toBeUndefined();
  });

  it('composes a new field on the same text state when secureTextEntry turns, so the password flag follows it', async () => {
    const {rerender} = await render(<TextField placeholder="Password" secureTextEntry testID="pw"/>);
    expect(byComposeTestID('pw').props.visualTransformation).toBe('password');
    expect(byComposeTestID('pw').props.keyboardOptions.keyboardType).toBe('password');
    const mounted = fields.mounted;
    const text = fields.values.at(-1) as {value: string};
    text.value = 'hunter22';
    // A change to anything else keeps the field it has.
    await rerender(<TextField placeholder="Password" secureTextEntry maxLength={20} testID="pw"/>);
    expect(fields.mounted).toBe(mounted);

    await rerender(<TextField placeholder="Password" maxLength={20} testID="pw"/>);
    expect(fields.mounted).toBe(mounted + 1);
    expect(byComposeTestID('pw').props.visualTransformation).toBe('none');
    expect(byComposeTestID('pw').props.keyboardOptions.keyboardType).toBe('text');
    // The new field is handed the state that holds what was typed.
    expect(fields.values.at(-1)).toBe(text);
    expect(text.value).toBe('hunter22');

    await rerender(<TextField placeholder="Password" maxLength={20} secureTextEntry testID="pw"/>);
    expect(fields.mounted).toBe(mounted + 2);
    expect(byComposeTestID('pw').props.visualTransformation).toBe('password');
    expect(fields.values.at(-1)).toBe(text);
  });

  it("names the inline field by its placeholder through React Native's label, its EditText's content description", async () => {
    await render(<TextField variant="inline" placeholder="Search notes" value="lisbon" testID="find"/>);
    expect(screen.getByLabelText('Search notes')).toBe(screen.getByTestId('find'));
  });
});
