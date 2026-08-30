import {Platform} from 'react-native';
import {fireEvent, render, renderHook, screen} from '@testing-library/react-native';
import {useNativeState} from '@expo/ui';
import {byComposeTestID, host, modifier} from '../__tests__/native';
import {useSyncedState} from './shared';
import {TextField} from '.';

const isIOS = Platform.OS === 'ios';
const field = (testID: string) => isIOS ? screen.getByTestId(testID) : byComposeTestID(testID);

describe(`TextField (${Platform.OS})`, () => {
  it('renders the native field with its placeholder', async () => {
    await render(<TextField placeholder="Email" testID="email"/>);
    const {props} = field('email');
    if (isIOS) {
      expect(props.placeholder).toBe('Email');
      expect(props.axis).toBe('horizontal');
      expect(props.modifiers).toEqual([]);
    } else {
      expect(props.enabled).toBe(true);
      expect(props.singleLine).toBe(true);
      expect(props.visualTransformation).toBe('none');
      expect(props.keyboardOptions).toEqual({keyboardType: 'text', imeAction: 'default'});
      expect(props.keyboardActions).toBeUndefined();
      expect(host(p => p.slotName === 'placeholder')).toBeTruthy();
      expect(host(p => p.text === 'Email').props.color).toBe('#9094A0');
    }
  });

  it('maps the keyboard variant and capitalization', async () => {
    await render(
      <TextField placeholder="Email" keyboardType="email" autoCapitalize="none" autoCorrect={false} testID="email"/>,
    );
    const {props} = field('email');
    if (isIOS) {
      expect(modifier(props, 'keyboardType')).toEqual({$type: 'keyboardType', keyboardType: 'email-address'});
      expect(modifier(props, 'textInputAutocapitalization')?.autocapitalization).toBe('never');
      expect(modifier(props, 'autocorrectionDisabled')?.disabled).toBe(true);
    } else {
      expect(props.keyboardOptions).toEqual({
        keyboardType: 'email',
        capitalization: 'none',
        autoCorrectEnabled: false,
        imeAction: 'default',
      });
    }
  });

  it('maps every keyboard variant', async () => {
    await render(
      <>
        <TextField keyboardType="number" testID="number"/>
        <TextField keyboardType="phone" testID="phone"/>
        <TextField keyboardType="decimal" testID="decimal"/>
        <TextField keyboardType="url" testID="url"/>
        <TextField autoCapitalize="words" testID="words"/>
      </>,
    );
    if (isIOS) {
      expect(modifier(field('number').props, 'keyboardType')?.keyboardType).toBe('numeric');
      expect(modifier(field('phone').props, 'keyboardType')?.keyboardType).toBe('phone-pad');
      expect(modifier(field('decimal').props, 'keyboardType')?.keyboardType).toBe('decimal-pad');
      expect(modifier(field('url').props, 'keyboardType')?.keyboardType).toBe('url');
      expect(modifier(field('words').props, 'textInputAutocapitalization')?.autocapitalization).toBe('words');
    } else {
      expect(field('number').props.keyboardOptions.keyboardType).toBe('number');
      expect(field('phone').props.keyboardOptions.keyboardType).toBe('phone');
      expect(field('decimal').props.keyboardOptions.keyboardType).toBe('decimal');
      expect(field('url').props.keyboardOptions.keyboardType).toBe('uri');
      expect(field('words').props.keyboardOptions.capitalization).toBe('words');
    }
  });

  it('masks secure entry', async () => {
    await render(<TextField placeholder="Password" secureTextEntry testID="pw"/>);
    const {props} = field('pw');
    if (isIOS) {
      // `SecureField` has no `axis`, unlike the multiline-capable `TextField`.
      expect(props.placeholder).toBe('Password');
      expect(props.axis).toBeUndefined();
    } else {
      expect(props.visualTransformation).toBe('password');
      expect(props.keyboardOptions.keyboardType).toBe('password');
    }
  });

  (isIOS ? it.skip : it)('uses the numeric password keyboard for secure number entry', async () => {
    await render(<TextField secureTextEntry keyboardType="number" testID="pin"/>);
    expect(field('pin').props.keyboardOptions.keyboardType).toBe('numberPassword');
  });

  it('grows vertically when multiline', async () => {
    await render(<TextField placeholder="Notes" multiline testID="notes"/>);
    const {props} = field('notes');
    if (isIOS) {
      expect(props.axis).toBe('vertical');
    } else {
      expect(props.singleLine).toBe(false);
    }
  });

  it('wires the submit action', async () => {
    const onSubmit = vi.fn();
    await render(<TextField onSubmit={onSubmit} testID="query"/>);
    const {props} = field('query');
    if (isIOS) {
      expect(modifier(props, 'onSubmit')).toBeDefined();
    } else {
      expect(props.keyboardOptions.imeAction).toBe('done');
      // `@expo/ui` folds `keyboardActions` into a single native event handler.
      const [view] = screen.container.queryAll(i => typeof i.props.onKeyboardAction === 'function');
      await fireEvent(view, 'keyboardAction', {nativeEvent: {action: 'done', value: 'hello'}});
      expect(onSubmit).toHaveBeenCalledWith('hello');
    }
  });

  it('shows the default IME action without a submit handler', async () => {
    await render(<TextField testID="plain"/>);
    const {props} = field('plain');
    if (isIOS) {
      expect(modifier(props, 'onSubmit')).toBeUndefined();
    } else {
      expect(props.keyboardOptions.imeAction).toBe('default');
      expect(screen.container.queryAll(i => typeof i.props.onKeyboardAction === 'function')).toHaveLength(0);
    }
  });

  it('disables the field', async () => {
    await render(<TextField disabled testID="locked"/>);
    const {props} = field('locked');
    if (isIOS) {
      expect(modifier(props, 'disabled')).toEqual({$type: 'disabled', disabled: true});
    } else {
      expect(props.enabled).toBe(false);
    }
  });

  it('tints the field with the accent color', async () => {
    await render(
      <>
        <TextField testID="plain"/>
        <TextField accentColor="#FF9500" testID="tinted"/>
      </>,
    );
    if (isIOS) {
      expect(modifier(field('plain').props, 'tint')).toBeUndefined();
      expect(modifier(field('tinted').props, 'tint')).toEqual({$type: 'tint', color: '#FF9500'});
    } else {
      expect(field('plain').props.colors.cursorColor).toBe('#007AFF');
      expect(field('tinted').props.colors.cursorColor).toBe('#FF9500');
    }
  });

  (isIOS ? it.skip : it)('strips the Material container and indicator so the row is borderless', async () => {
    await render(<TextField testID="row"/>);
    const {props} = field('row');
    expect(props.colors).toMatchObject({
      focusedContainerColor: 'transparent',
      unfocusedContainerColor: 'transparent',
      focusedIndicatorColor: 'transparent',
      unfocusedIndicatorColor: 'transparent',
      focusedTextColor: '#1D1B20FF',
      disabledTextColor: '#49454FFF',
    });
    expect(modifier(props, 'fillMaxWidth')).toBeDefined();
    expect(modifier(props, 'offset')).toEqual({$type: 'offset', x: -16, y: 0});
  });

  it('forwards focus and length limits', async () => {
    await render(<TextField autoFocus maxLength={6} testID="code"/>);
    const {props} = field('code');
    expect(props.autoFocus).toBe(true);
    expect(props.maxLength).toBe(6);
  });
});

describe(`useSyncedState (${Platform.OS})`, () => {
  it('pushes controlled value changes into the native state', async () => {
    const {result, rerender} = await renderHook(
      ({value}: {value?: string}) => {
        const state = useNativeState(value ?? '');
        useSyncedState(state, value);
        return state;
      },
      {initialProps: {value: 'a'}},
    );
    expect(result.current.value).toBe('a');
    await rerender({value: 'b'});
    expect(result.current.value).toBe('b');
  });

  it('leaves uncontrolled fields to manage their own state', async () => {
    const {result, rerender} = await renderHook(
      ({value}: {value?: string}) => {
        const state = useNativeState('typed');
        useSyncedState(state, value);
        return state;
      },
      {initialProps: {value: undefined}},
    );
    expect(result.current.value).toBe('typed');
    await rerender({value: undefined});
    expect(result.current.value).toBe('typed');
  });
});
