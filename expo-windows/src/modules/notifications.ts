import type {NativeModule} from 'expo-modules-core';
import type {NotificationResponseEvent} from '../native';
import type {PermissionResponse} from './permissions';
import {DeviceEventEmitter} from 'react-native';
import {native} from '../native';
import {nativeModuleClass} from './base';
import {DENIED, GRANTED} from './permissions';

/** The package's identifier for a tap on the notification itself. */
export const DEFAULT_ACTION = 'expo.modules.notifications.actions.DEFAULT';

export type ContentInput = {
  title?: string | null;
  subtitle?: string | null;
  body?: string | null;
  data?: Record<string, unknown>;
  badge?: number | null;
  sound?: boolean | string | null;
  categoryIdentifier?: string | null;
};

/** The package's `NotificationContent`, as the app reads it back. */
export type Content = {
  title: string | null;
  subtitle: string | null;
  body: string | null;
  data: Record<string, unknown>;
  categoryIdentifier: string | null;
  sound: 'default' | 'custom' | null;
  launchImageName: string | null;
  badge: number | null;
};

/** The package's native trigger inputs: what its JavaScript hands the scheduler. */
export type TriggerInput =
  | null
  | {type: 'channel'; channelId?: string}
  | {type: 'timeInterval'; seconds: number; repeats: boolean; channelId?: string}
  | {type: 'date'; timestamp: number; channelId?: string}
  | {type: 'daily'; hour: number; minute: number; channelId?: string}
  | {type: 'weekly'; weekday: number; hour: number; minute: number; channelId?: string}
  | {type: 'monthly'; day: number; hour: number; minute: number; channelId?: string}
  | {type: 'yearly'; month: number; day: number; hour: number; minute: number; channelId?: string}
  | {type: 'calendar'; repeats?: boolean; year?: number; month?: number; weekday?: number; day?: number; hour?: number; minute?: number; second?: number; channelId?: string};

export type Trigger = ({type: string} & Record<string, unknown>) | null;
export type Request = {identifier: string; content: Content; trigger: Trigger};
export type Notification = {date: number; request: Request};
export type Response = {notification: Notification; actionIdentifier: string; userText?: string};
export type Action = {identifier: string; buttonTitle: string; textInput?: unknown; options?: unknown};
export type Category = {identifier: string; actions: Action[]; options?: unknown};

/** `setTimeout` past the platform's 24.8-day limit: chained until the moment comes. */
const MAX_TIMEOUT = 2 ** 31 - 1;

export function later(ms: number, callback: () => void): {clear(): void} {
  let handle: ReturnType<typeof setTimeout>;
  const step = (remaining: number) => {
    handle = setTimeout(
      () => {
        if (remaining > MAX_TIMEOUT) step(remaining - MAX_TIMEOUT);
        else callback();
      },
      Math.min(remaining, MAX_TIMEOUT),
    );
  };
  step(Math.max(ms, 0));
  return {
    clear() {
      clearTimeout(handle);
    },
  };
}

/** The first moment after `from` on a day `matches` at the time of day given, within the next 400 days. */
function nextTime(from: number, matches: (day: Date) => boolean, hour: number, minute: number, second = 0): number | null {
  const start = new Date(from);
  for (let offset = 0; offset < 400; offset++) {
    const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + offset, hour, minute, second, 0);
    if (day.getTime() > from && matches(day)) return day.getTime();
  }
  return null;
}

/**
 * When a trigger next fires, in milliseconds since 1970, or null when it
 * never will: now for none (and Android's channel trigger), the interval
 * from now, the date given (in seconds, as the package hands it), the next
 * time of day, weekday (1 is Sunday), day of the month or day of the year
 * (the month from 0, as the package counts), and for a calendar trigger the
 * next day matching the components given, at the time given.
 */
export function nextTriggerDate(trigger: TriggerInput, from = Date.now()): number | null {
  if (!trigger || trigger.type === 'channel') return from;
  switch (trigger.type) {
    case 'timeInterval':
      return from + trigger.seconds * 1000;
    case 'date':
      return trigger.timestamp * 1000;
    case 'daily':
      return nextTime(from, () => true, trigger.hour, trigger.minute);
    case 'weekly':
      return nextTime(from, day => day.getDay() === trigger.weekday - 1, trigger.hour, trigger.minute);
    case 'monthly':
      return nextTime(from, day => day.getDate() === trigger.day, trigger.hour, trigger.minute);
    case 'yearly':
      return nextTime(from, day => day.getMonth() === trigger.month && day.getDate() === trigger.day, trigger.hour, trigger.minute);
    case 'calendar':
      return nextTime(
        from,
        day =>
          (trigger.year === undefined || day.getFullYear() === trigger.year) &&
          (trigger.month === undefined || day.getMonth() === trigger.month - 1) &&
          (trigger.day === undefined || day.getDate() === trigger.day) &&
          (trigger.weekday === undefined || day.getDay() === trigger.weekday - 1),
        trigger.hour ?? 0,
        trigger.minute ?? 0,
        trigger.second ?? 0,
      );
  }
}

/** Whether a trigger fires again after it fires. */
export function repeats(trigger: TriggerInput): boolean {
  if (!trigger) return false;
  switch (trigger.type) {
    case 'timeInterval':
      return trigger.repeats;
    case 'calendar':
      return trigger.repeats === true;
    case 'daily':
    case 'weekly':
    case 'monthly':
    case 'yearly':
      return true;
    default:
      return false;
  }
}

export function contentOf(input: ContentInput): Content {
  const {sound} = input;
  return {
    title: input.title ?? null,
    subtitle: input.subtitle ?? null,
    body: input.body ?? null,
    data: input.data ?? {},
    categoryIdentifier: input.categoryIdentifier ?? null,
    sound: sound === false || sound === null ? null : typeof sound === 'string' && sound !== 'default' ? 'custom' : 'default',
    launchImageName: null,
    badge: input.badge ?? null,
  };
}

/** The trigger as the app reads it back: the input without Android's channel, a date as milliseconds. */
export function triggerOf(input: TriggerInput): Trigger {
  if (!input || input.type === 'channel') return null;
  const {channelId: _channel, ...trigger} = input;
  if (trigger.type === 'date') return {type: 'date', value: trigger.timestamp * 1000};
  return trigger;
}

type Scheduled = {request: Request; input: TriggerInput; timer: {clear(): void} | null};

type EmitterEvents = {
  onDidReceiveNotification(notification: Notification): void;
  onDidReceiveNotificationResponse(response: Response): void;
  onDidClearNotificationResponse(): void;
};

type HandlerEvents = {
  onHandleNotification(event: unknown): void;
  onHandleNotificationTimeout(event: unknown): void;
};

export type NotificationModules = {
  ExpoNotificationScheduler: {
    scheduleNotificationAsync(identifier: string, content: ContentInput, trigger: TriggerInput): Promise<string>;
    cancelScheduledNotificationAsync(identifier: string): Promise<void>;
    cancelAllScheduledNotificationsAsync(): Promise<void>;
    getAllScheduledNotificationsAsync(): Promise<Request[]>;
    getNextTriggerDateAsync(trigger: TriggerInput): Promise<number | null>;
  };
  ExpoNotificationPresenter: {
    getPresentedNotificationsAsync(): Promise<Notification[]>;
    dismissNotificationAsync(identifier: string): Promise<void>;
    dismissAllNotificationsAsync(): Promise<void>;
  };
  ExpoNotificationPermissionsModule: {
    getPermissionsAsync(): Promise<PermissionResponse>;
    requestPermissionsAsync(): Promise<PermissionResponse>;
  };
  ExpoNotificationsEmitter: InstanceType<NativeModule<EmitterEvents>> & {
    /** React Native's legacy emitter wants this beside `addListener`, or it warns at every wrap. */
    removeListeners(count: number): void;
    getLastNotificationResponse(): Response | null;
    clearLastNotificationResponse(): void;
  };
  ExpoNotificationsHandlerModule: InstanceType<NativeModule<HandlerEvents>> & {
    removeListeners(count: number): void;
    handleNotificationAsync(identifier: string, behavior: unknown): Promise<void>;
  };
  ExpoBadgeModule: {
    getBadgeCountAsync(): Promise<number>;
    setBadgeCountAsync(count: number): Promise<boolean>;
  };
  ExpoNotificationChannelManager: {
    getNotificationChannelsAsync(): Promise<never[]>;
    getNotificationChannelAsync(channelId: string): Promise<null>;
    setNotificationChannelAsync(channelId: string, channel: unknown): Promise<null>;
    deleteNotificationChannelAsync(channelId: string): Promise<void>;
  };
  ExpoNotificationChannelGroupManager: {
    getNotificationChannelGroupsAsync(): Promise<never[]>;
    getNotificationChannelGroupAsync(groupId: string): Promise<null>;
    setNotificationChannelGroupAsync(groupId: string, group: unknown): Promise<null>;
    deleteNotificationChannelGroupAsync(groupId: string): Promise<void>;
  };
  ExpoNotificationCategoriesModule: {
    getNotificationCategoriesAsync(): Promise<Category[]>;
    setNotificationCategoryAsync(identifier: string, actions: Action[], options?: unknown): Promise<Category>;
    deleteNotificationCategoryAsync(identifier: string): Promise<boolean>;
  };
};

/**
 * `expo-notifications`' modules, what its JavaScript asks of nine native
 * names, over the runtime's notifications library — the Windows App SDK's
 * app notification manager, which shows the toasts and lists them, and
 * the taskbar badge. Scheduling is the runtime's: each request waits in
 * JavaScript for its trigger's moment (the package's interval, date, daily,
 * weekly, monthly, yearly and calendar triggers) and is then shown as a
 * toast and told to the app as received; a schedule lives as long as the
 * app does, since an unpackaged app has no scheduler of the system's. A
 * click on a toast — while the app runs, or the launch it caused — is the
 * app's response, kept as the last one. Permission is the manager's
 * setting: granted while the user lets the app notify, denied otherwise,
 * with Settings as the place to ask. Channels are Android's and answer
 * empty; categories are kept for the app to read back, without buttons
 * on the toast; the handler is told nothing to decide, since a toast shows
 * whether the app is in front or not. Push tokens and background tasks
 * stay unavailable: they need a service.
 */
export function createNotificationModules(): NotificationModules {
  const Base = nativeModuleClass();
  const scheduled = new Map<string, Scheduled>();
  const presented = new Map<string, Notification>();
  const categories = new Map<string, Category>();
  let badge = 0;
  let lastResponse: Response | null = null;

  // The two the package listens to. Marked by the registry with their names, so that its legacy
  // emitter listens to them directly; `removeListeners` beside `addListener` for React Native's, which warns without it.
  class Emitter extends Base<EmitterEvents> {
    removeListeners(_count: number): void {}
    getLastNotificationResponse(): Response | null {
      return lastResponse;
    }
    clearLastNotificationResponse(): void {
      lastResponse = null;
      this.emit('onDidClearNotificationResponse');
    }
  }
  const emitter = new Emitter();

  class Handler extends Base<HandlerEvents> {
    removeListeners(_count: number): void {}
    async handleNotificationAsync(_identifier: string, _behavior: unknown): Promise<void> {}
  }

  // Listening from the start: a click may come before the app listens, and is kept as the last response for it.
  DeviceEventEmitter.addListener('onNotificationResponse', (event: NotificationResponseEvent) => {
    const notification = presented.get(event.id) ?? {
      date: Date.now(),
      request: scheduled.get(event.id)?.request ?? {identifier: event.id, content: contentOf({}), trigger: null},
    };
    const response: Response = {notification, actionIdentifier: event.action === 'default' ? DEFAULT_ACTION : event.action};
    if (event.userText) response.userText = event.userText;
    lastResponse = response;
    emitter.emit('onDidReceiveNotificationResponse', response);
  });

  async function setBadge(count: number): Promise<boolean> {
    badge = count;
    const library = native.notifications();
    return library ? library.setBadge(count) : false;
  }

  async function present(identifier: string, request: Request): Promise<void> {
    const notification: Notification = {date: Date.now(), request};
    presented.set(identifier, notification);
    const {content} = request;
    try {
      await native.notifications()?.show(identifier, content.title ?? '', content.body ?? '', content.sound === null);
    } catch (error) {
      // The toast could not be shown: the app still hears of the notification, and the console why.
      console.warn(`expo-windows: the notification "${identifier}" could not be shown: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (content.badge !== null) await setBadge(content.badge);
    emitter.emit('onDidReceiveNotification', notification);
  }

  /** Waits for the request's next moment, then shows it and waits again when it repeats. */
  function arm(identifier: string, entry: Scheduled): void {
    const at = nextTriggerDate(entry.input);
    if (at === null) {
      scheduled.delete(identifier);
      return;
    }
    entry.timer = later(at - Date.now(), () => {
      void present(identifier, entry.request);
      if (repeats(entry.input)) arm(identifier, entry);
      else scheduled.delete(identifier);
    });
  }

  function permission(): PermissionResponse {
    return native.notifications()?.setting() === 'Enabled' ? GRANTED : DENIED;
  }

  return {
    ExpoNotificationScheduler: {
      async scheduleNotificationAsync(identifier, content, trigger) {
        scheduled.get(identifier)?.timer?.clear();
        const entry: Scheduled = {request: {identifier, content: contentOf(content), trigger: triggerOf(trigger)}, input: trigger, timer: null};
        scheduled.set(identifier, entry);
        arm(identifier, entry);
        return identifier;
      },
      async cancelScheduledNotificationAsync(identifier) {
        scheduled.get(identifier)?.timer?.clear();
        scheduled.delete(identifier);
      },
      async cancelAllScheduledNotificationsAsync() {
        for (const entry of scheduled.values()) entry.timer?.clear();
        scheduled.clear();
      },
      async getAllScheduledNotificationsAsync() {
        return [...scheduled.values()].map(entry => entry.request);
      },
      async getNextTriggerDateAsync(trigger) {
        return nextTriggerDate(trigger);
      },
    },
    ExpoNotificationPresenter: {
      async getPresentedNotificationsAsync() {
        const library = native.notifications();
        if (library) {
          const tags = new Set(await library.getPresented());
          for (const identifier of presented.keys()) if (!tags.has(identifier)) presented.delete(identifier);
        }
        return [...presented.values()];
      },
      async dismissNotificationAsync(identifier) {
        presented.delete(identifier);
        await native.notifications()?.remove(identifier);
      },
      async dismissAllNotificationsAsync() {
        presented.clear();
        await native.notifications()?.removeAll();
      },
    },
    ExpoNotificationPermissionsModule: {
      async getPermissionsAsync() {
        return permission();
      },
      async requestPermissionsAsync() {
        return permission();
      },
    },
    ExpoNotificationsEmitter: emitter,
    ExpoNotificationsHandlerModule: new Handler(),
    ExpoBadgeModule: {
      async getBadgeCountAsync() {
        return badge;
      },
      setBadgeCountAsync: setBadge,
    },
    ExpoNotificationChannelManager: {
      async getNotificationChannelsAsync() {
        return [];
      },
      async getNotificationChannelAsync() {
        return null;
      },
      async setNotificationChannelAsync() {
        return null;
      },
      async deleteNotificationChannelAsync() {},
    },
    ExpoNotificationChannelGroupManager: {
      async getNotificationChannelGroupsAsync() {
        return [];
      },
      async getNotificationChannelGroupAsync() {
        return null;
      },
      async setNotificationChannelGroupAsync() {
        return null;
      },
      async deleteNotificationChannelGroupAsync() {},
    },
    ExpoNotificationCategoriesModule: {
      async getNotificationCategoriesAsync() {
        return [...categories.values()];
      },
      async setNotificationCategoryAsync(identifier, actions, options) {
        const category: Category = options === undefined ? {identifier, actions} : {identifier, actions, options};
        categories.set(identifier, category);
        return category;
      },
      async deleteNotificationCategoryAsync(identifier) {
        return categories.delete(identifier);
      },
    },
  };
}
