import {act, render, waitFor} from '@testing-library/react-native';
import {byComposeTestID, nodes} from '../__tests__/native';
import {Toast} from '.';

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

describe('Toast (android)', () => {
  beforeEach(() => {
    showSnackbar.mockResolvedValue('dismissed');
  });

  it('shows the Material snackbar while visible, in the inverse surface colors', async () => {
    await render(<Toast message="3 files added" visible testID="toast"/>);
    expect(showSnackbar).toHaveBeenCalledWith({
      message: '3 files added',
      actionLabel: undefined,
      duration: 'short',
    });
    expect(byComposeTestID('toast')).toBeTruthy();
    // The bar itself is Compose's, styled with the inverse surface roles.
    expect(nodes().some(n => n.type.endsWith('SnackbarView'))).toBe(true);
  });

  it('asks for nothing while it is not visible', async () => {
    await render(<Toast message="3 files added" visible={false}/>);
    expect(showSnackbar).not.toHaveBeenCalled();
  });

  it('takes the long duration and reports the action Compose resolves with', async () => {
    const onPress = vi.fn();
    const onDismiss = vi.fn();
    showSnackbar.mockResolvedValue('actionPerformed');
    await render(
      <Toast
        message="Note deleted"
        visible
        duration={10000}
        action={{label: 'Undo', onPress}}
        onDismiss={onDismiss}
      />,
    );
    expect(showSnackbar).toHaveBeenCalledWith({
      message: 'Note deleted',
      actionLabel: 'Undo',
      duration: 'long',
    });
    await waitFor(() => expect(onPress).toHaveBeenCalledTimes(1));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('reports the dismissal alone when the snackbar times out', async () => {
    const onPress = vi.fn();
    const onDismiss = vi.fn();
    await render(<Toast message="Saved" visible action={{label: 'Undo', onPress}} onDismiss={onDismiss}/>);
    await waitFor(() => expect(onDismiss).toHaveBeenCalledTimes(1));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('drops a resolution that lands after the toast is gone', async () => {
    const onDismiss = vi.fn();
    let resolve: (value: string) => void = () => {};
    showSnackbar.mockReturnValue(new Promise(done => {
      resolve = done;
    }));
    const {unmount} = await render(<Toast message="Saved" visible onDismiss={onDismiss}/>);
    await act(async () => {
      unmount();
    });
    await act(async () => {
      resolve('dismissed');
    });
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
