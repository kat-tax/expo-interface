import {StyleSheet} from 'react-native';
import {render} from '@testing-library/react-native';
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
});
