import {act, render} from '@testing-library/react-native';
import {fireIsland, island, islands} from '../__tests__/windows';
import {Toast} from '.';

const BAR = 'ExpoInterfaceInfoBar';

describe('Toast (windows)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing while hidden', async () => {
    await render(<Toast message="Copied" visible={false}/>);
    expect(islands(BAR)).toHaveLength(0);
  });

  it('shows an InfoBar with the message and puts it away when its time is up', async () => {
    const onDismiss = vi.fn();
    await render(<Toast message="Copied" visible onDismiss={onDismiss} testID="toast"/>);
    const bar = island(BAR);
    expect(bar.props).toMatchObject({message: 'Copied', closable: true, testID: 'toast'});
    expect(bar.props.actionLabel).toBeUndefined();
    expect(bar.props.onAction).toBeUndefined();
    await act(async () => {
      vi.advanceTimersByTime(4000);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('takes the action and closes, and closes from the close button', async () => {
    const onUndo = vi.fn();
    const onDismiss = vi.fn();
    await render(<Toast message="Deleted" visible action={{label: 'Undo', onPress: onUndo}} onDismiss={onDismiss} duration={10000}/>);
    expect(island(BAR).props.actionLabel).toBe('Undo');
    await fireIsland(island(BAR), 'action');
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
    await fireIsland(island(BAR), 'close');
    expect(onDismiss).toHaveBeenCalledTimes(2);
  });

  it('cannot be closed, and never times out, without onDismiss', async () => {
    const onUndo = vi.fn();
    await render(<Toast message="Deleted" visible action={{label: 'Undo', onPress: onUndo}}/>);
    expect(island(BAR).props.closable).toBe(false);
    expect(island(BAR).props.onClose).toBeUndefined();
    await fireIsland(island(BAR), 'action');
    expect(onUndo).toHaveBeenCalledTimes(1);
    await act(async () => {
      vi.advanceTimersByTime(10000);
    });
    expect(islands(BAR)).toHaveLength(1);
  });
});
