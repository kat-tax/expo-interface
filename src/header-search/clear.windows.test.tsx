import {act, useEffect, useState} from 'react';
import {Platform, Text} from 'react-native';
import {renderApp} from 'expo-vitest/router';
import {TabStack} from '../tab-stack';
import {HeaderSearch} from '.';

/** Takes the search away, from the test. */
let hide = () => {};

function Toggle({onChangeText}: {onChangeText: (text: string) => void}) {
  const [shown, setShown] = useState(true);
  useEffect(() => {
    hide = () => setShown(false);
  });
  return shown ? <HeaderSearch placement="inline" placeholder="Find a drop" onChangeText={onChangeText}/> : null;
}

describe(`HeaderSearch on its way out (${Platform.OS})`, () => {
  it('tells the app its query is empty once the search goes', async () => {
    const onChangeText = vi.fn();
    await renderApp({
      _layout: () => <TabStack title="Drops"/>,
      index: () => (
        <>
          <Toggle onChangeText={onChangeText}/>
          <Text>Home screen</Text>
        </>
      ),
    });
    expect(onChangeText).not.toHaveBeenCalled();
    await act(async () => hide());
    expect(onChangeText).toHaveBeenCalledTimes(1);
    expect(onChangeText).toHaveBeenLastCalledWith('');
  });
});
