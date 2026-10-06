import type {SearchFieldCommands} from './types';
import {createRef} from 'react';
import {StyleSheet} from 'react-native';
import {act, render} from '@testing-library/react-native';
import {fireIsland, island} from 'expo-vitest/windows';
import {SearchField} from '.';

const BOX = 'ExpoInterfaceAutoSuggestBox';

describe('SearchField (windows)', () => {
  it('is a real AutoSuggestBox, which draws the box and places its own list', async () => {
    await render(<SearchField value="dem" suggestions={['Demo Reel']} onChangeText={() => {}} testID="q"/>);
    expect(island(BOX).props).toMatchObject({
      text: 'dem',
      placeholder: 'Search',
      suggestions: JSON.stringify(['Demo Reel']),
      theme: 'light',
      testID: 'q',
    });
    expect(StyleSheet.flatten(island(BOX).props.style)).toMatchObject({height: 32});
  });

  it('reports what a person typed, and what they submitted', async () => {
    const onChangeText = vi.fn();
    const onSubmit = vi.fn();
    await render(<SearchField value="" placeholder="Find a drop" onChangeText={onChangeText} onSubmit={onSubmit}/>);
    await fireIsland(island(BOX), 'textChange', {text: 'demo'});
    expect(onChangeText).toHaveBeenCalledWith('demo');
    await fireIsland(island(BOX), 'submit', {text: 'Demo Reel'});
    expect(onSubmit).toHaveBeenCalledWith('Demo Reel');
    expect(island(BOX).props.placeholder).toBe('Find a drop');
  });

  it('hands over an empty list when there is nothing to suggest, and can be turned off', async () => {
    await render(<SearchField value="" disabled onChangeText={() => {}}/>);
    expect(island(BOX).props).toMatchObject({suggestions: '[]', disabled: true});
  });

  it('asks the box for the focus on mount, reports the focus coming and going, and the keys by name', async () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    const onKeyPress = vi.fn();
    await render(<SearchField value="" onChangeText={() => {}} autoFocus onFocus={onFocus} onBlur={onBlur} onKeyPress={onKeyPress}/>);
    expect(island(BOX).props.autoFocus).toBe(true);
    await fireIsland(island(BOX), 'focusChange', {focused: true});
    expect(onFocus).toHaveBeenCalledTimes(1);
    await fireIsland(island(BOX), 'focusChange', {focused: false});
    expect(onBlur).toHaveBeenCalledTimes(1);
    await fireIsland(island(BOX), 'keyPress', {key: 'Escape', shiftKey: false});
    expect(onKeyPress).toHaveBeenCalledWith('Escape');
  });

  it('survives the focus events without handlers, and sends no key event handler without one', async () => {
    await render(<SearchField value="" onChangeText={() => {}}/>);
    expect(island(BOX).props.onKeyPress).toBeUndefined();
    await fireIsland(island(BOX), 'focusChange', {focused: true});
    await fireIsland(island(BOX), 'focusChange', {focused: false});
  });

  it('asks the island for the focus through the ref, and leaves it where it is in a renderer without the command or once the box is gone', async () => {
    const ref = createRef<SearchFieldCommands>();
    const {unmount} = await render(<SearchField ref={ref} value="" onChangeText={() => {}}/>);
    const commands = ref.current!;
    expect(() => {
      commands.focus();
      commands.blur();
    }).not.toThrow();
    // Unmounting is an update of its own here, so the box's ref is cleared once it has run.
    await act(async () => {
      unmount();
    });
    expect(() => commands.focus()).not.toThrow();
  });
});
