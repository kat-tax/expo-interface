import {render, screen} from '@testing-library/react-native';
import {fireIsland, island, islands} from 'expo-vitest/windows';
import {inputScopeFor} from './index.windows';
import {TextField} from '.';

const BOX = 'ExpoInterfaceTextBox';

describe('TextField (windows)', () => {
  it('renders a borderless TextBox island for the row variant', async () => {
    await render(<TextField placeholder="Name" value="Ada" onChangeText={vi.fn()} testID="name"/>);
    const box = island(BOX);
    expect(box.props).toMatchObject({
      value: 'Ada',
      placeholder: 'Name',
      label: 'Name',
      borderless: true,
      maxLength: 0,
      inputScope: 'default',
      spellCheck: true,
      testID: 'name',
      style: {alignSelf: 'stretch'},
    });
    expect(box.props.password).toBeUndefined();
  });

  it('maps the keyboard, secure entry, lines, length, focus and correction', async () => {
    await render(
      <TextField
        placeholder="Email"
        keyboardType="email"
        secureTextEntry
        multiline
        maxLength={80}
        autoFocus
        autoCorrect={false}
        disabled
        accentColor="#FF9500"
      />,
    );
    expect(island(BOX).props).toMatchObject({
      inputScope: 'email',
      password: true,
      multiline: true,
      maxLength: 80,
      autoFocus: true,
      spellCheck: false,
      disabled: true,
      accentColor: '#FF9500',
    });
  });

  it('reports text, submit and key events, and keeps its own text when uncontrolled', async () => {
    const onChangeText = vi.fn();
    const onSubmit = vi.fn();
    const onKeyPress = vi.fn();
    await render(<TextField onChangeText={onChangeText} onSubmit={onSubmit} onKeyPress={onKeyPress}/>);
    await fireIsland(island(BOX), 'changeText', {text: 'hello'});
    expect(onChangeText).toHaveBeenCalledWith('hello');
    expect(island(BOX).props.value).toBe('hello');
    await fireIsland(island(BOX), 'submit', {text: 'hello'});
    expect(onSubmit).toHaveBeenCalledWith('hello');
    await fireIsland(island(BOX), 'keyPress', {key: 'Enter', shiftKey: true});
    expect(onKeyPress).toHaveBeenCalledWith('Enter', true);
  });

  it('wires no submit or key handler when none is given', async () => {
    await render(<TextField/>);
    expect(island(BOX).props.onSubmit).toBeUndefined();
    expect(island(BOX).props.onKeyPress).toBeUndefined();
  });

  it('renders the inline variant as a React Native input', async () => {
    await render(<TextField variant="inline" placeholder="Search" testID="search"/>);
    expect(islands(BOX)).toHaveLength(0);
    expect(screen.getByTestId('search').props.placeholder).toBe('Search');
  });

  it('maps every keyboard variant to an input scope', () => {
    expect(inputScopeFor('email')).toBe('email');
    expect(inputScopeFor('number')).toBe('number');
    expect(inputScopeFor('phone')).toBe('phone');
    expect(inputScopeFor('decimal')).toBe('decimal');
    expect(inputScopeFor('url')).toBe('url');
    expect(inputScopeFor('default')).toBe('default');
    expect(inputScopeFor(undefined)).toBe('default');
  });
});
