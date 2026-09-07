import {Platform} from 'react-native';
import {createHeaderSlot, noSubscription} from './context';

/**
 * The store behind a folded header, which is plain JavaScript on every
 * platform: the web bar subscribes to it, the screens' headers publish into
 * it. What matters is who owns the slot while screens come and go — React
 * mounts the screen being pushed before it unmounts the one behind it.
 */
describe(`header slot (${Platform.OS})`, () => {
  it('holds the last header published, and clears on its way out', () => {
    const slot = createHeaderSlot();
    expect(slot.get()).toBeNull();

    slot.set('list', {title: 'Drops'});
    expect(slot.get()).toEqual({title: 'Drops'});

    slot.set('list', null);
    expect(slot.get()).toBeNull();
  });

  it('ignores a screen clearing the slot after a newer one has taken it', () => {
    const slot = createHeaderSlot();
    slot.set('list', {title: 'Drops'});
    // The pushed screen publishes, then the one behind it unmounts and
    // clears: the slot is not its own any more, so the title stands.
    slot.set('detail', {title: 'Detail', onBack: () => {}});
    slot.set('list', null);
    expect(slot.get()?.title).toBe('Detail');

    // The screen that does own it still clears.
    slot.set('detail', null);
    expect(slot.get()).toBeNull();
  });

  it('tells subscribers about a change, and stops once they leave', () => {
    const slot = createHeaderSlot();
    const listener = vi.fn();
    const unsubscribe = slot.subscribe(listener);

    slot.set('list', {title: 'Drops'});
    expect(listener).toHaveBeenCalledTimes(1);

    // A clear the slot ignores is not a change, so nobody is told.
    slot.set('other', null);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    slot.set('list', {title: 'Renamed'});
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('gives a bar with no slot a subscription that never fires', () => {
    // `useSyncExternalStore` still needs one where a header cannot fold in;
    // it ignores the listener, so unsubscribing is nothing to undo.
    expect(noSubscription()()).toBeUndefined();
  });
});
