import {createRef} from 'react';
import {Platform, Text, View} from 'react-native';
import {render, renderHook, screen} from '@testing-library/react-native';
import {DropZone, useDrop} from '.';

describe(`DropZone (${Platform.OS})`, () => {
  it('draws its children, and nothing is ever held over it', async () => {
    await render(<DropZone onDrop={() => {}} testID="zone"><Text>Documents</Text></DropZone>);
    expect(screen.getByTestId('zone')).toBeOnTheScreen();
    expect(screen.getByText('Documents')).toBeOnTheScreen();
    const {result} = await renderHook(() => useDrop(createRef<View>(), {onDrop: () => {}}));
    expect(result.current).toEqual({over: false});
  });
});
