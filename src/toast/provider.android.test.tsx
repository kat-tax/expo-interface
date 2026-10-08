import type {ToastApi} from './provider';
import {useEffect} from 'react';
import {StyleSheet} from 'react-native';
import {act, render, screen} from '@testing-library/react-native';
import {setInsets} from 'vitest-native/helpers';
import {NativeTabsContext} from '../tabs/context';
import {ToastProvider, useToast} from './provider';

const {showSnackbar} = vi.hoisted(() => ({showSnackbar: vi.fn()}));

// The Material snackbar is asked for through the host's ref, which only
// exists on a device: stand a fake one in its place.
vi.mock('@expo/ui/jetpack-compose', async importOriginal => {
  const actual = await importOriginal<typeof import('@expo/ui/jetpack-compose')>();
  return {
    ...actual,
    SnackbarHost: ({ref, children, modifiers}: any) => {
      if (ref && typeof ref === 'object') ref.current = {showSnackbar};
      return <actual.Box modifiers={modifiers}>{children}</actual.Box>;
    },
  };
});

let toasts: ToastApi;
function Hand() {
  const api = useToast();
  useEffect(() => {
    toasts = api;
  });
  return null;
}

describe('ToastProvider (android)', () => {
  it('asks Compose for one snackbar at a time, the next once the last is gone', async () => {
    let resolve = (_result: string) => {};
    showSnackbar.mockImplementation(() => new Promise<string>(done => {
      resolve = done;
    }));
    await render(<ToastProvider><Hand/></ToastProvider>);
    await act(async () => {
      toasts.show('Copied');
      toasts.show({message: 'Saved', duration: 8000});
    });
    expect(showSnackbar).toHaveBeenCalledTimes(1);
    expect(showSnackbar).toHaveBeenLastCalledWith(expect.objectContaining({message: 'Copied', duration: 'short'}));
    await act(async () => {
      resolve('dismissed');
    });
    expect(showSnackbar).toHaveBeenCalledTimes(2);
    expect(showSnackbar).toHaveBeenLastCalledWith(expect.objectContaining({message: 'Saved', duration: 'long'}));
  });

  it('stands its snackbar on the navigation bar, and on the tab host\'s bottom inside a tab', async () => {
    // A snackbar that stays up, so its floor stays drawn.
    showSnackbar.mockImplementation(() => new Promise<string>(() => {}));
    await act(async () => setInsets({top: 0, left: 0, right: 0, bottom: 48}));
    try {
      await render(<ToastProvider><Hand/></ToastProvider>);
      await act(async () => {
        toasts.show('Copied');
      });
      const floor = () => StyleSheet.flatten(screen.getByTestId('toast-floor').props.style);
      expect(floor().bottom).toBe(48);
      // The tab host keeps a tab's screens above the navigation bar, which the window's inset still holds.
      await render(
        <NativeTabsContext.Provider value={true}>
          <ToastProvider><Hand/></ToastProvider>
        </NativeTabsContext.Provider>,
      );
      await act(async () => {
        toasts.show('Copied');
      });
      expect(floor().bottom).toBe(0);
    } finally {
      await act(async () => setInsets({top: 0, left: 0, right: 0, bottom: 0}));
    }
  });
});
