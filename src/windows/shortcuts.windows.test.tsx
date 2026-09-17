import {fireEvent, render, screen} from '@testing-library/react-native';
import {Text} from 'react-native';
import {LayerHost} from './layer';
import {bindShortcut, dispatchShortcut, matchesShortcut, parseShortcut, useKeyboardShortcut} from './shortcuts';

function key(name: string, modifiers: Partial<{ctrlKey: boolean; shiftKey: boolean; altKey: boolean; metaKey: boolean}> = {}) {
  return {nativeEvent: {key: name, code: name, ctrlKey: false, shiftKey: false, altKey: false, metaKey: false, ...modifiers}};
}

describe('shortcuts (windows)', () => {
  it('parses modifiers and keys in any order, case and spelling', () => {
    expect(parseShortcut('Ctrl+Shift+S')).toEqual({ctrl: true, shift: true, alt: false, meta: false, key: 's'});
    expect(parseShortcut('shift + control + n')).toEqual({ctrl: true, shift: true, alt: false, meta: false, key: 'n'});
    expect(parseShortcut('Alt+Left')).toEqual({ctrl: false, shift: false, alt: true, meta: false, key: 'ArrowLeft'});
    expect(parseShortcut('F2')).toEqual({ctrl: false, shift: false, alt: false, meta: false, key: 'F2'});
    expect(parseShortcut('Win+Esc')).toEqual({ctrl: false, shift: false, alt: false, meta: true, key: 'Escape'});
    expect(parseShortcut('Ctrl+Space')).toEqual({ctrl: true, shift: false, alt: false, meta: false, key: ' '});
    expect(parseShortcut('++')).toEqual({ctrl: false, shift: false, alt: false, meta: false, key: ''});
  });

  it('matches a key event on the key and exactly its modifiers', () => {
    const save = parseShortcut('Ctrl+S');
    expect(matchesShortcut(key('s', {ctrlKey: true}).nativeEvent, save)).toBe(true);
    expect(matchesShortcut(key('S', {ctrlKey: true, shiftKey: true}).nativeEvent, save)).toBe(false);
    expect(matchesShortcut(key('s').nativeEvent, save)).toBe(false);
    expect(matchesShortcut(key('ArrowLeft', {altKey: true}).nativeEvent, parseShortcut('Alt+Left'))).toBe(true);
  });

  it('dispatches to the last binding of a key, and to none once released', () => {
    const first = vi.fn();
    const second = vi.fn();
    const releaseFirst = bindShortcut('Ctrl+S', first);
    const releaseSecond = bindShortcut('Ctrl+S', second);
    expect(dispatchShortcut(key('s', {ctrlKey: true}))).toBe(true);
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
    releaseSecond();
    expect(dispatchShortcut(key('s', {ctrlKey: true}))).toBe(true);
    expect(first).toHaveBeenCalledTimes(1);
    releaseFirst();
    expect(dispatchShortcut(key('s', {ctrlKey: true}))).toBe(false);
  });

  it('binds through the hook while mounted and enabled, and the host dispatches before its own keys', async () => {
    const save = vi.fn();
    const onBack = vi.fn();
    function Screen({enabled}: {enabled: boolean}) {
      useKeyboardShortcut('Ctrl+S', save, enabled);
      useKeyboardShortcut(null, save);
      return <Text>Editor</Text>;
    }
    const {rerender, unmount} = await render(
      <LayerHost onBack={onBack} testID="host">
        <Screen enabled/>
      </LayerHost>,
    );
    const host = screen.getByTestId('host');
    await fireEvent(host, 'keyDown', key('s', {ctrlKey: true}));
    expect(save).toHaveBeenCalledTimes(1);
    // Unbound keys still reach the host's own handling.
    await fireEvent(host, 'keyDown', key('ArrowLeft', {altKey: true}));
    expect(onBack).toHaveBeenCalledTimes(1);
    await rerender(
      <LayerHost onBack={onBack} testID="host">
        <Screen enabled={false}/>
      </LayerHost>,
    );
    await fireEvent(host, 'keyDown', key('s', {ctrlKey: true}));
    expect(save).toHaveBeenCalledTimes(1);
    unmount();
    expect(dispatchShortcut(key('s', {ctrlKey: true}))).toBe(false);
  });
});
