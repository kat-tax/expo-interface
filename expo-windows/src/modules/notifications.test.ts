import {DeviceEventEmitter, TurboModuleRegistry} from 'react-native';
import {contentOf, createNotificationModules, DEFAULT_ACTION, later, nextTriggerDate, repeats, triggerOf} from './notifications';
import {DENIED, GRANTED} from './permissions';

function withLibrary(setting = 'Enabled', presentedTags: string[] | (() => string[]) = () => []) {
  const library = {
    setting: vi.fn(() => setting),
    show: vi.fn(async () => {}),
    remove: vi.fn(async () => {}),
    removeAll: vi.fn(async () => {}),
    getPresented: vi.fn(async () => (typeof presentedTags === 'function' ? presentedTags() : presentedTags)),
    setBadge: vi.fn(async () => true),
  };
  vi.spyOn(TurboModuleRegistry, 'get').mockImplementation(name => (name === 'ExpoWindowsNotifications' ? library : null) as never);
  return library;
}

// 2026-09-17, a Thursday, at 10:30 local time.
const NOW = new Date(2026, 8, 17, 10, 30, 0, 0).getTime();

describe('the triggers (windows)', () => {
  it('fires now for none, after the interval, at the date, and at the next matching time of day', () => {
    expect(nextTriggerDate(null, NOW)).toBe(NOW);
    expect(nextTriggerDate({type: 'channel'}, NOW)).toBe(NOW);
    expect(nextTriggerDate({type: 'timeInterval', seconds: 90, repeats: false}, NOW)).toBe(NOW + 90_000);
    expect(nextTriggerDate({type: 'date', timestamp: 1_800_000_000}, NOW)).toBe(1_800_000_000_000);
    expect(nextTriggerDate({type: 'daily', hour: 11, minute: 0}, NOW)).toBe(new Date(2026, 8, 17, 11, 0).getTime());
    expect(nextTriggerDate({type: 'daily', hour: 9, minute: 0}, NOW)).toBe(new Date(2026, 8, 18, 9, 0).getTime());
    // Weekday 1 is Sunday: the next Sunday is the 20th.
    expect(nextTriggerDate({type: 'weekly', weekday: 1, hour: 8, minute: 15}, NOW)).toBe(new Date(2026, 8, 20, 8, 15).getTime());
    expect(nextTriggerDate({type: 'weekly', weekday: 5, hour: 10, minute: 0}, NOW)).toBe(new Date(2026, 8, 24, 10, 0).getTime());
    expect(nextTriggerDate({type: 'monthly', day: 1, hour: 7, minute: 0}, NOW)).toBe(new Date(2026, 9, 1, 7, 0).getTime());
    expect(nextTriggerDate({type: 'yearly', month: 0, day: 1, hour: 0, minute: 0}, NOW)).toBe(new Date(2027, 0, 1, 0, 0).getTime());
    expect(nextTriggerDate({type: 'calendar', month: 12, day: 25, hour: 18, minute: 30, second: 5}, NOW)).toBe(new Date(2026, 11, 25, 18, 30, 5).getTime());
    expect(nextTriggerDate({type: 'calendar', weekday: 2, hour: 6}, NOW)).toBe(new Date(2026, 8, 21, 6, 0).getTime());
    expect(nextTriggerDate({type: 'calendar', year: 2026, month: 9, day: 17, hour: 10, minute: 31}, NOW)).toBe(NOW + 60_000);
    // A moment that never comes again.
    expect(nextTriggerDate({type: 'calendar', year: 2025, month: 1, day: 1}, NOW)).toBeNull();
    expect(nextTriggerDate({type: 'monthly', day: 31, hour: 0, minute: 0}, new Date(2026, 1, 1).getTime())).toBe(new Date(2026, 2, 31, 0, 0).getTime());
  });

  it('knows which triggers repeat, and how the app reads a trigger and content back', () => {
    expect(repeats(null)).toBe(false);
    expect(repeats({type: 'timeInterval', seconds: 1, repeats: true})).toBe(true);
    expect(repeats({type: 'timeInterval', seconds: 1, repeats: false})).toBe(false);
    expect(repeats({type: 'date', timestamp: 1})).toBe(false);
    expect(repeats({type: 'channel'})).toBe(false);
    expect(repeats({type: 'daily', hour: 1, minute: 1})).toBe(true);
    expect(repeats({type: 'calendar', repeats: true})).toBe(true);
    expect(repeats({type: 'calendar'})).toBe(false);
    expect(triggerOf(null)).toBeNull();
    expect(triggerOf({type: 'channel', channelId: 'x'})).toBeNull();
    expect(triggerOf({type: 'timeInterval', seconds: 5, repeats: true, channelId: 'x'})).toEqual({type: 'timeInterval', seconds: 5, repeats: true});
    expect(triggerOf({type: 'date', timestamp: 2})).toEqual({type: 'date', value: 2000});
    expect(contentOf({})).toEqual({title: null, subtitle: null, body: null, data: {}, categoryIdentifier: null, sound: 'default', launchImageName: null, badge: null});
    expect(contentOf({title: 'T', body: 'B', sound: false, badge: 2, data: {a: 1}, categoryIdentifier: 'c'})).toMatchObject({title: 'T', body: 'B', sound: null, badge: 2, data: {a: 1}, categoryIdentifier: 'c'});
    expect(contentOf({sound: 'ping.wav'}).sound).toBe('custom');
    expect(contentOf({sound: 'default'}).sound).toBe('default');
    expect(contentOf({sound: null}).sound).toBeNull();
  });

  it('waits past the platform\'s timer limit by chaining, and can be cleared', () => {
    vi.useFakeTimers();
    try {
      const fired = vi.fn();
      later(2 ** 31 + 5000, fired);
      vi.advanceTimersByTime(2 ** 31 - 1);
      expect(fired).not.toHaveBeenCalled();
      vi.advanceTimersByTime(5001);
      expect(fired).toHaveBeenCalledTimes(1);
      const cleared = vi.fn();
      later(1000, cleared).clear();
      vi.advanceTimersByTime(2000);
      expect(cleared).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('expo-notifications modules (windows)', () => {
  afterEach(() => {
    DeviceEventEmitter.removeAllListeners('onNotificationResponse');
  });

  it('schedules a notification for its trigger, shows it as a toast and tells the app, again when it repeats', async () => {
    vi.useFakeTimers();
    try {
      const library = withLibrary();
      const modules = createNotificationModules();
      const received = vi.fn();
      modules.ExpoNotificationsEmitter.addListener('onDidReceiveNotification', received);
      await expect(modules.ExpoNotificationScheduler.scheduleNotificationAsync('a', {title: 'Hello', body: 'World', badge: 3}, {type: 'timeInterval', seconds: 2, repeats: true})).resolves.toBe('a');
      await expect(modules.ExpoNotificationScheduler.scheduleNotificationAsync('b', {title: 'Once', sound: false}, null)).resolves.toBe('b');
      await expect(modules.ExpoNotificationScheduler.getAllScheduledNotificationsAsync()).resolves.toMatchObject([{identifier: 'a', trigger: {type: 'timeInterval', seconds: 2, repeats: true}}, {identifier: 'b', trigger: null}]);
      await vi.advanceTimersByTimeAsync(1);
      expect(library.show).toHaveBeenCalledWith('b', 'Once', '', true);
      expect(received).toHaveBeenCalledWith(expect.objectContaining({request: expect.objectContaining({identifier: 'b'})}));
      await vi.advanceTimersByTimeAsync(2000);
      expect(library.show).toHaveBeenCalledWith('a', 'Hello', 'World', false);
      expect(library.setBadge).toHaveBeenCalledWith(3);
      await expect(modules.ExpoBadgeModule.getBadgeCountAsync()).resolves.toBe(3);
      await vi.advanceTimersByTimeAsync(2000);
      expect(library.show).toHaveBeenCalledTimes(3);
      // Still scheduled, since it repeats; the one-off is gone.
      await expect(modules.ExpoNotificationScheduler.getAllScheduledNotificationsAsync()).resolves.toHaveLength(1);
      await modules.ExpoNotificationScheduler.cancelScheduledNotificationAsync('a');
      await vi.advanceTimersByTimeAsync(4000);
      expect(library.show).toHaveBeenCalledTimes(3);
      await expect(modules.ExpoNotificationScheduler.getNextTriggerDateAsync({type: 'timeInterval', seconds: 10, repeats: false})).resolves.toBe(Date.now() + 10_000);
      // Scheduling the same identifier again replaces the wait; a trigger that never comes is dropped.
      await modules.ExpoNotificationScheduler.scheduleNotificationAsync('c', {}, {type: 'timeInterval', seconds: 5, repeats: false});
      await modules.ExpoNotificationScheduler.scheduleNotificationAsync('c', {}, {type: 'timeInterval', seconds: 50, repeats: false});
      await modules.ExpoNotificationScheduler.scheduleNotificationAsync('d', {}, {type: 'calendar', year: 2000, month: 1, day: 1});
      await expect(modules.ExpoNotificationScheduler.getAllScheduledNotificationsAsync()).resolves.toMatchObject([{identifier: 'c'}]);
      await vi.advanceTimersByTimeAsync(6000);
      expect(library.show).toHaveBeenCalledTimes(3);
      await modules.ExpoNotificationScheduler.cancelAllScheduledNotificationsAsync();
      await vi.advanceTimersByTimeAsync(60_000);
      expect(library.show).toHaveBeenCalledTimes(3);
      // Content without words shows an empty toast, silent when told.
      await modules.ExpoNotificationScheduler.scheduleNotificationAsync('f', {sound: null}, null);
      await vi.advanceTimersByTimeAsync(1);
      expect(library.show).toHaveBeenLastCalledWith('f', '', '', true);
      // A toast the system refuses is still told to the app, and the console told why.
      const warned = vi.spyOn(console, 'warn').mockImplementation(() => {});
      library.show.mockRejectedValueOnce(new Error('off'));
      await modules.ExpoNotificationScheduler.scheduleNotificationAsync('e', {title: 'E'}, null);
      await vi.advanceTimersByTimeAsync(1);
      expect(received).toHaveBeenLastCalledWith(expect.objectContaining({request: expect.objectContaining({identifier: 'e'})}));
      expect(warned).toHaveBeenCalledWith('expo-windows: the notification "e" could not be shown: off');
      library.show.mockRejectedValueOnce('gone');
      await modules.ExpoNotificationScheduler.scheduleNotificationAsync('g', {title: 'G'}, null);
      await vi.advanceTimersByTimeAsync(1);
      expect(warned).toHaveBeenLastCalledWith('expo-windows: the notification "g" could not be shown: gone');
      warned.mockRestore();
    } finally {
      vi.useRealTimers();
    }
  });

  it('lists what the notification center still shows, and dismisses by identifier or all', async () => {
    vi.useFakeTimers();
    try {
      const tags: string[] = [];
      const library = withLibrary('Enabled', () => tags);
      const modules = createNotificationModules();
      await modules.ExpoNotificationScheduler.scheduleNotificationAsync('x', {title: 'X'}, null);
      await modules.ExpoNotificationScheduler.scheduleNotificationAsync('y', {title: 'Y'}, null);
      await vi.advanceTimersByTimeAsync(1);
      tags.push('x', 'y');
      await expect(modules.ExpoNotificationPresenter.getPresentedNotificationsAsync()).resolves.toMatchObject([{request: {identifier: 'x'}}, {request: {identifier: 'y'}}]);
      // The user dismissed one from the center.
      tags.splice(0, 1);
      await expect(modules.ExpoNotificationPresenter.getPresentedNotificationsAsync()).resolves.toMatchObject([{request: {identifier: 'y'}}]);
      await modules.ExpoNotificationPresenter.dismissNotificationAsync('y');
      expect(library.remove).toHaveBeenCalledWith('y');
      await modules.ExpoNotificationPresenter.dismissAllNotificationsAsync();
      expect(library.removeAll).toHaveBeenCalled();
      await expect(modules.ExpoNotificationPresenter.getPresentedNotificationsAsync()).resolves.toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('turns a click on a toast into the app\'s response, kept as the last one until cleared', async () => {
    vi.useFakeTimers();
    try {
      withLibrary();
      const modules = createNotificationModules();
      const responded = vi.fn();
      const cleared = vi.fn();
      modules.ExpoNotificationsEmitter.addListener('onDidReceiveNotificationResponse', responded);
      modules.ExpoNotificationsEmitter.addListener('onDidClearNotificationResponse', cleared);
      expect(modules.ExpoNotificationsEmitter.getLastNotificationResponse()).toBeNull();
      await modules.ExpoNotificationScheduler.scheduleNotificationAsync('shown', {title: 'Shown'}, null);
      await vi.advanceTimersByTimeAsync(1);
      DeviceEventEmitter.emit('onNotificationResponse', {id: 'shown', action: 'default', userText: ''});
      expect(responded).toHaveBeenCalledWith({notification: expect.objectContaining({request: expect.objectContaining({identifier: 'shown'})}), actionIdentifier: DEFAULT_ACTION});
      expect(modules.ExpoNotificationsEmitter.getLastNotificationResponse()).toMatchObject({actionIdentifier: DEFAULT_ACTION});
      // A click on a notification of an earlier run, or one still waiting: the request known, or a bare one.
      await modules.ExpoNotificationScheduler.scheduleNotificationAsync('waiting', {title: 'Later'}, {type: 'timeInterval', seconds: 60, repeats: false});
      DeviceEventEmitter.emit('onNotificationResponse', {id: 'waiting', action: 'reply', userText: 'hi'});
      expect(responded).toHaveBeenLastCalledWith({notification: expect.objectContaining({request: expect.objectContaining({content: expect.objectContaining({title: 'Later'})})}), actionIdentifier: 'reply', userText: 'hi'});
      DeviceEventEmitter.emit('onNotificationResponse', {id: 'unknown', action: 'default', userText: ''});
      expect(responded).toHaveBeenLastCalledWith({notification: expect.objectContaining({request: {identifier: 'unknown', content: contentOf({}), trigger: null}}), actionIdentifier: DEFAULT_ACTION});
      modules.ExpoNotificationsEmitter.clearLastNotificationResponse();
      expect(modules.ExpoNotificationsEmitter.getLastNotificationResponse()).toBeNull();
      expect(cleared).toHaveBeenCalledTimes(1);
      expect(modules.ExpoNotificationsEmitter.removeListeners(1)).toBeUndefined();
      await modules.ExpoNotificationScheduler.cancelAllScheduledNotificationsAsync();
    } finally {
      vi.useRealTimers();
    }
  });

  it('answers the permission from the manager\'s setting, the handler with nothing to decide, and the badge', async () => {
    const library = withLibrary('Enabled');
    const modules = createNotificationModules();
    await expect(modules.ExpoNotificationPermissionsModule.getPermissionsAsync()).resolves.toBe(GRANTED);
    await expect(modules.ExpoNotificationPermissionsModule.requestPermissionsAsync()).resolves.toBe(GRANTED);
    library.setting.mockReturnValue('DisabledForApplication');
    await expect(modules.ExpoNotificationPermissionsModule.getPermissionsAsync()).resolves.toBe(DENIED);
    await expect(modules.ExpoNotificationsHandlerModule.handleNotificationAsync('a', {shouldShowBanner: true})).resolves.toBeUndefined();
    expect(modules.ExpoNotificationsHandlerModule.removeListeners(1)).toBeUndefined();
    await expect(modules.ExpoBadgeModule.setBadgeCountAsync(5)).resolves.toBe(true);
    expect(library.setBadge).toHaveBeenCalledWith(5);
    await expect(modules.ExpoBadgeModule.getBadgeCountAsync()).resolves.toBe(5);
  });

  it('answers Android\'s channels as none, keeps categories for the app to read back', async () => {
    withLibrary();
    const modules = createNotificationModules();
    await expect(modules.ExpoNotificationChannelManager.getNotificationChannelsAsync()).resolves.toEqual([]);
    await expect(modules.ExpoNotificationChannelManager.getNotificationChannelAsync('c')).resolves.toBeNull();
    await expect(modules.ExpoNotificationChannelManager.setNotificationChannelAsync('c', {name: 'C'})).resolves.toBeNull();
    await expect(modules.ExpoNotificationChannelManager.deleteNotificationChannelAsync('c')).resolves.toBeUndefined();
    await expect(modules.ExpoNotificationChannelGroupManager.getNotificationChannelGroupsAsync()).resolves.toEqual([]);
    await expect(modules.ExpoNotificationChannelGroupManager.getNotificationChannelGroupAsync('g')).resolves.toBeNull();
    await expect(modules.ExpoNotificationChannelGroupManager.setNotificationChannelGroupAsync('g', {name: 'G'})).resolves.toBeNull();
    await expect(modules.ExpoNotificationChannelGroupManager.deleteNotificationChannelGroupAsync('g')).resolves.toBeUndefined();
    const actions = [{identifier: 'yes', buttonTitle: 'Yes'}];
    await expect(modules.ExpoNotificationCategoriesModule.setNotificationCategoryAsync('ask', actions)).resolves.toEqual({identifier: 'ask', actions});
    await expect(modules.ExpoNotificationCategoriesModule.setNotificationCategoryAsync('ask2', actions, {showTitle: true})).resolves.toEqual({identifier: 'ask2', actions, options: {showTitle: true}});
    await expect(modules.ExpoNotificationCategoriesModule.getNotificationCategoriesAsync()).resolves.toHaveLength(2);
    await expect(modules.ExpoNotificationCategoriesModule.deleteNotificationCategoryAsync('ask')).resolves.toBe(true);
    await expect(modules.ExpoNotificationCategoriesModule.deleteNotificationCategoryAsync('ask')).resolves.toBe(false);
  });

  it('keeps notifications in JavaScript alone, denied and unshown, without the library', async () => {
    vi.useFakeTimers();
    try {
      vi.spyOn(TurboModuleRegistry, 'get').mockReturnValue(null);
      const modules = createNotificationModules();
      await expect(modules.ExpoNotificationPermissionsModule.getPermissionsAsync()).resolves.toBe(DENIED);
      const received = vi.fn();
      modules.ExpoNotificationsEmitter.addListener('onDidReceiveNotification', received);
      await modules.ExpoNotificationScheduler.scheduleNotificationAsync('n', {title: 'N', badge: 1}, null);
      await vi.advanceTimersByTimeAsync(1);
      expect(received).toHaveBeenCalledTimes(1);
      await expect(modules.ExpoNotificationPresenter.getPresentedNotificationsAsync()).resolves.toHaveLength(1);
      await expect(modules.ExpoBadgeModule.setBadgeCountAsync(2)).resolves.toBe(false);
      await modules.ExpoNotificationPresenter.dismissNotificationAsync('n');
      await modules.ExpoNotificationPresenter.dismissAllNotificationsAsync();
      await expect(modules.ExpoNotificationPresenter.getPresentedNotificationsAsync()).resolves.toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });
});
