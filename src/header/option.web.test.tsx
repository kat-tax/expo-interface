import {renderHook} from '@testing-library/react';
import {useHeaderOption} from './option';

/** The screen's navigation, as `useNavigation` hands it over. */
const navigation = vi.hoisted(() => ({getState: vi.fn(), setOptions: vi.fn()}));
vi.mock('expo-router', () => {
  const router = {useNavigation: () => navigation, useRoute: () => ({key: 'index-1'})};
  // The web pipeline reads a CommonJS module through its default export.
  return {...router, default: router};
});

beforeEach(() => {
  navigation.getState.mockReset();
  navigation.setOptions.mockReset();
});

describe('useHeaderOption', () => {
  it('puts the value on the route while mounted, and takes it off on the way out', () => {
    navigation.getState.mockReturnValue({routes: [{key: 'index-1'}]});
    const {rerender, unmount} = renderHook(({value}) => useHeaderOption('headerAccessory', value), {initialProps: {value: 'row'}});
    expect(navigation.setOptions).toHaveBeenLastCalledWith({headerAccessory: 'row'});
    // A new value clears the old one and sets itself, in that order.
    rerender({value: 'other'});
    expect(navigation.setOptions.mock.calls.slice(-2)).toEqual([[{headerAccessory: undefined}], [{headerAccessory: 'other'}]]);
    unmount();
    expect(navigation.setOptions).toHaveBeenLastCalledWith({headerAccessory: undefined});
  });

  it('sets nothing from a route the state does not hold yet, a preloaded one', () => {
    navigation.getState.mockReturnValue({routes: [{key: 'other-1'}]});
    const {unmount} = renderHook(() => useHeaderOption('headerSearch', 'search'));
    unmount();
    expect(navigation.setOptions).not.toHaveBeenCalled();
  });

  it('sets nothing while the navigator has no state', () => {
    navigation.getState.mockReturnValue(undefined);
    const {unmount} = renderHook(() => useHeaderOption('headerSearch', 'search'));
    unmount();
    expect(navigation.setOptions).not.toHaveBeenCalled();
  });
});
