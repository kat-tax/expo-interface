import {createBackStore} from './shell';

describe('the pane\'s back store', () => {
  it('holds the way back of the last stack to publish, and the earlier one again once it is taken away', () => {
    const store = createBackStore();
    const listener = vi.fn();
    store.subscribe(listener);
    expect(store.get()).toBeNull();
    const outer = {goBack() {}, popToTop() {}};
    const inner = {goBack() {}, popToTop() {}};
    store.set('outer', outer);
    expect(store.get()).toBe(outer);
    store.set('inner', inner);
    expect(store.get()).toBe(inner);
    store.set('inner', null);
    expect(store.get()).toBe(outer);
    store.set('outer', null);
    expect(store.get()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(4);
  });

  it('puts a stack that publishes again in front, whatever order it first published in', () => {
    const store = createBackStore();
    const outer = {goBack() {}, popToTop() {}};
    const inner = {goBack() {}, popToTop() {}};
    const outerAgain = {goBack() {}, popToTop() {}};
    store.set('outer', outer);
    store.set('inner', inner);
    store.set('outer', outerAgain);
    expect(store.get()).toBe(outerAgain);
    store.set('outer', null);
    expect(store.get()).toBe(inner);
  });

  it('says nothing when nothing changed, and to no one once unsubscribed', () => {
    const store = createBackStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    // Taking away a way back that was never published changes nothing.
    store.set('none', null);
    expect(listener).not.toHaveBeenCalled();
    const goBack = {goBack() {}, popToTop() {}};
    store.set('one', goBack);
    store.set('one', goBack);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    store.set('one', null);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.get()).toBeNull();
  });
});
