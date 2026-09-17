import {DENIED, type PermissionResponse} from './permissions';
import {unavailableClass, unavailableMethod} from './unavailable';

const CALENDAR = 'Calendar';

async function denied(): Promise<PermissionResponse> {
  return DENIED;
}

/**
 * `ExpoCalendar`, the legacy module of `expo-calendar`, and `CalendarNext`,
 * its current one. Windows keeps a user's calendars behind package identity
 * (the appointments store is for packaged apps), which an unpackaged app has
 * none of, so the permissions are denied and the stores empty; the members
 * that construct or fetch entries throw the package's unavailability error,
 * and the ones the legacy API guards for itself are absent, as on web.
 */
export const ExpoCalendar = {
  getCalendarPermissionsAsync: denied,
  requestCalendarPermissionsAsync: denied,
  getRemindersPermissionsAsync: denied,
  requestRemindersPermissionsAsync: denied,
};

export const CalendarNext = {
  ExpoCalendar: unavailableClass(CALENDAR, 'ExpoCalendar'),
  ExpoCalendarEvent: unavailableClass(CALENDAR, 'ExpoCalendarEvent'),
  ExpoCalendarAttendee: unavailableClass(CALENDAR, 'ExpoCalendarAttendee'),
  ExpoCalendarReminder: unavailableClass(CALENDAR, 'ExpoCalendarReminder'),
  getDefaultCalendar: unavailableMethod(CALENDAR, 'getDefaultCalendar'),
  getCalendarById: unavailableMethod(CALENDAR, 'getCalendarById'),
  presentPicker: unavailableMethod(CALENDAR, 'presentPicker'),
  getEventById: unavailableMethod(CALENDAR, 'getEventById'),
  getReminderById: unavailableMethod(CALENDAR, 'getReminderById'),
  async getCalendars(): Promise<never[]> {
    return [];
  },
  async listEvents(): Promise<never[]> {
    return [];
  },
  getSourcesSync(): never[] {
    return [];
  },
  getCalendarPermissions: denied,
  requestCalendarPermissions: denied,
  getRemindersPermissions: denied,
  requestRemindersPermissions: denied,
};
