/**
 * `ExpoTaskManager`, `ExpoBackgroundFetch` and `ExpoBackgroundTask`: the
 * task modules. A Windows app runs while its window is open and has no
 * scheduler that wakes JavaScript afterwards, so tasks can be defined — the
 * packages keep them in JavaScript — but never registered: the task manager
 * reports itself unavailable and the schedulers their `Restricted` status,
 * as the packages' web modules do. The members that are not here
 * (`registerTaskAsync` and the rest) the packages report unavailable.
 */
export const ExpoTaskManager = {
  get EVENT_NAME(): string {
    return 'TaskManager.executeTask';
  },
  addListener(): void {},
  removeListeners(): void {},
  async isAvailableAsync(): Promise<boolean> {
    return false;
  },
};

/** `BackgroundFetchStatus.Restricted` in `expo-background-fetch`. */
export const BACKGROUND_FETCH_RESTRICTED = 2;

export const ExpoBackgroundFetch = {
  async getStatusAsync(): Promise<number> {
    return BACKGROUND_FETCH_RESTRICTED;
  },
};

/** `BackgroundTaskStatus.Restricted` in `expo-background-task`. */
export const BACKGROUND_TASK_RESTRICTED = 1;

export const ExpoBackgroundTask = {
  async getStatusAsync(): Promise<number> {
    return BACKGROUND_TASK_RESTRICTED;
  },
};
