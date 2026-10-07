import type {ToastApi} from './provider';
import {useEffect} from 'react';
import {act, render} from '@testing-library/react-native';
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
});
