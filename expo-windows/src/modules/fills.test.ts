import {Linking} from 'react-native';
import {ExpoAgeRange} from './age-range';
import {ExpoApplication} from './application';
import {BACKGROUND_FETCH_RESTRICTED, BACKGROUND_TASK_RESTRICTED, ExpoBackgroundFetch, ExpoBackgroundTask, ExpoTaskManager} from './background';
import {ExpoBrightness} from './brightness';
import {CalendarNext, ExpoCalendar} from './calendar';
import {CELLULAR_GENERATION_UNKNOWN, ExpoCellular} from './cellular';
import {Contact, ExpoContacts, ExpoContactsNext} from './contacts';
import {deterministicUniformValue, EAS_CLIENT_ID, EASClient} from './eas-client';
import {ExpoHaptics} from './haptics';
import {ExpoMailComposer, mailtoUrl} from './mail-composer';
import {DENIED, GRANTED} from './permissions';
import {ExpoSMS} from './sms';
import {ExpoStoreReview} from './store-review';
import {ExpoTrackingTransparency} from './tracking';

/** Runs `body` with the embedded app config set to `config`, and puts the previous one back. */
async function withAppConfig(config: unknown, body: () => void | Promise<void>) {
  const saved = process.env.EXPO_PUBLIC_WINDOWS_APP_CONFIG;
  try {
    if (config === undefined) delete process.env.EXPO_PUBLIC_WINDOWS_APP_CONFIG;
    else process.env.EXPO_PUBLIC_WINDOWS_APP_CONFIG = JSON.stringify(config);
    await body();
  } finally {
    if (saved === undefined) delete process.env.EXPO_PUBLIC_WINDOWS_APP_CONFIG;
    else process.env.EXPO_PUBLIC_WINDOWS_APP_CONFIG = saved;
  }
}

describe('permissions (windows)', () => {
  it('has the two answers a feature without a prompt can give', () => {
    expect(DENIED).toEqual({status: 'denied', expires: 'never', granted: false, canAskAgain: false});
    expect(GRANTED).toEqual({status: 'granted', expires: 'never', granted: true, canAskAgain: true});
  });
});

describe('ExpoApplication (windows)', () => {
  it('names and versions the app from the embedded config, and has no package identity', async () => {
    await withAppConfig({name: 'Drops', version: '2.1.0'}, () => {
      expect(ExpoApplication.applicationName).toBe('Drops');
      expect(ExpoApplication.nativeApplicationVersion).toBe('2.1.0');
    });
    await withAppConfig({name: 7, version: 3}, () => {
      expect(ExpoApplication.applicationName).toBeNull();
      expect(ExpoApplication.nativeApplicationVersion).toBeNull();
    });
    await withAppConfig(undefined, () => {
      expect(ExpoApplication.applicationName).toBeNull();
      expect(ExpoApplication.nativeApplicationVersion).toBeNull();
    });
    expect(ExpoApplication.applicationId).toBeNull();
    expect(ExpoApplication.nativeBuildVersion).toBeNull();
    expect(ExpoApplication.androidId).toBeNull();
    // What the package reports unavailable itself is absent, as on web.
    expect(ExpoApplication).not.toHaveProperty('getInstallationTimeAsync');
    expect(ExpoApplication).not.toHaveProperty('getIosIdForVendorAsync');
  });
});

describe('ExpoStoreReview (windows)', () => {
  it('has no review prompt', async () => {
    await expect(ExpoStoreReview.isAvailableAsync()).resolves.toBe(false);
    await expect(ExpoStoreReview.requestReview()).rejects.toThrow(/StoreReview\.requestReview/);
  });
});

describe('the task modules (windows)', () => {
  it('report the task manager unavailable and the schedulers restricted', async () => {
    expect(ExpoTaskManager.EVENT_NAME).toBe('TaskManager.executeTask');
    await expect(ExpoTaskManager.isAvailableAsync()).resolves.toBe(false);
    expect(() => ExpoTaskManager.addListener()).not.toThrow();
    expect(() => ExpoTaskManager.removeListeners()).not.toThrow();
    await expect(ExpoBackgroundFetch.getStatusAsync()).resolves.toBe(BACKGROUND_FETCH_RESTRICTED);
    await expect(ExpoBackgroundTask.getStatusAsync()).resolves.toBe(BACKGROUND_TASK_RESTRICTED);
    expect(ExpoTaskManager).not.toHaveProperty('registerTaskAsync');
    expect(ExpoBackgroundFetch).not.toHaveProperty('registerTaskAsync');
  });
});

describe('ExpoCellular (windows)', () => {
  it('has no carrier', async () => {
    expect(ExpoCellular.allowsVoip).toBeNull();
    expect(ExpoCellular.carrier).toBeNull();
    expect(ExpoCellular.isoCountryCode).toBeNull();
    expect(ExpoCellular.mobileCountryCode).toBeNull();
    expect(ExpoCellular.mobileNetworkCode).toBeNull();
    await expect(ExpoCellular.getCellularGenerationAsync()).resolves.toBe(CELLULAR_GENERATION_UNKNOWN);
    await expect(ExpoCellular.allowsVoipAsync()).resolves.toBeNull();
    await expect(ExpoCellular.getIsoCountryCodeAsync()).resolves.toBeNull();
    await expect(ExpoCellular.getCarrierNameAsync()).resolves.toBeNull();
    await expect(ExpoCellular.getMobileCountryCodeAsync()).resolves.toBeNull();
    await expect(ExpoCellular.getMobileNetworkCodeAsync()).resolves.toBeNull();
  });
});

describe('ExpoTrackingTransparency, ExpoSMS, ExpoBrightness, ExpoHaptics (windows)', () => {
  it('answer what the platform has: no advertising id, no messaging, no brightness, no vibration', async () => {
    expect(ExpoTrackingTransparency.getAdvertisingId()).toBeNull();
    await expect(ExpoSMS.isAvailableAsync()).resolves.toBe(false);
    expect(ExpoSMS).not.toHaveProperty('sendSMSAsync');
    await expect(ExpoBrightness.getPermissionsAsync()).resolves.toBe(DENIED);
    await expect(ExpoBrightness.requestPermissionsAsync()).resolves.toBe(DENIED);
    expect(ExpoBrightness).not.toHaveProperty('getBrightnessAsync');
    await expect(ExpoHaptics.impactAsync()).resolves.toBeUndefined();
    await expect(ExpoHaptics.notificationAsync()).resolves.toBeUndefined();
    await expect(ExpoHaptics.selectionAsync()).resolves.toBeUndefined();
    await expect(ExpoHaptics.performHapticsAsync()).resolves.toBeUndefined();
  });
});

describe('ExpoAgeRange (windows)', () => {
  it('knows no age signal', async () => {
    await expect(ExpoAgeRange.requestAgeRangeAsync()).resolves.toEqual({lowerBound: 18, upperBound: null});
    await expect(ExpoAgeRange.isEligibleForAgeFeaturesAsync()).resolves.toBeNull();
    await expect(ExpoAgeRange.showSignificantUpdateAcknowledgmentAsync()).resolves.toBeUndefined();
    await expect(ExpoAgeRange.getRequiredRegulatoryFeaturesAsync()).resolves.toBeNull();
    await expect(ExpoAgeRange.requestAgeSignalsAccessAsync()).resolves.toBeNull();
    expect(() => ExpoAgeRange.setFakeAgeSignals()).not.toThrow();
  });
});

describe('EASClient (windows)', () => {
  it('has a client id for the launch and a value in [0, 1) derived from it', () => {
    expect(EASClient.clientID).toBe(EAS_CLIENT_ID);
    expect(EAS_CLIENT_ID).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(EASClient.deterministicUniformValue).toBe(deterministicUniformValue(EAS_CLIENT_ID));
    expect(deterministicUniformValue('00000000-0000-0000-0000-000000000000')).toBe(0);
    expect(deterministicUniformValue('ffffffff-ffff-ffff-ffff-ffffffffffff')).toBeLessThan(1);
    expect(deterministicUniformValue('80000000-0000-0000-0000-000000000000')).toBe(0.5);
    expect(deterministicUniformValue(EAS_CLIENT_ID)).toBeGreaterThanOrEqual(0);
  });
});

describe('ExpoMailComposer (windows)', () => {
  it('builds the mailto link from the options', () => {
    expect(mailtoUrl({})).toBe('mailto:');
    expect(mailtoUrl({recipients: 'a@b.c'})).toBe('mailto:a@b.c');
    expect(mailtoUrl({recipients: ['a@b.c', 'd@e.f'], ccRecipients: 'g@h.i', bccRecipients: ['j@k.l'], subject: 'Hi there', body: 'Line one\nLine two & more'})).toBe(
      'mailto:a@b.c,d@e.f?cc=g%40h.i&bcc=j%40k.l&subject=Hi%20there&body=Line%20one%0ALine%20two%20%26%20more',
    );
    expect(mailtoUrl({subject: '', body: 'b'})).toBe('mailto:?body=b');
  });

  it('opens the link through the shell and reports the outcome undetermined', async () => {
    const openURL = vi.spyOn(Linking, 'openURL').mockResolvedValue(true);
    await expect(ExpoMailComposer.composeAsync({recipients: ['a@b.c'], subject: 'S'})).resolves.toEqual({status: 'undetermined'});
    expect(openURL).toHaveBeenCalledWith('mailto:a@b.c?subject=S');
    await expect(ExpoMailComposer.isAvailableAsync()).resolves.toBe(true);
    expect(ExpoMailComposer.getClients()).toEqual([]);
  });
});

describe('the calendar modules (windows)', () => {
  it('deny the permissions, hold no calendars, and throw for what needs a store', async () => {
    for (const method of ['getCalendarPermissionsAsync', 'requestCalendarPermissionsAsync', 'getRemindersPermissionsAsync', 'requestRemindersPermissionsAsync'] as const) {
      await expect(ExpoCalendar[method]()).resolves.toBe(DENIED);
    }
    for (const method of ['getCalendarPermissions', 'requestCalendarPermissions', 'getRemindersPermissions', 'requestRemindersPermissions'] as const) {
      await expect(CalendarNext[method]()).resolves.toBe(DENIED);
    }
    await expect(CalendarNext.getCalendars()).resolves.toEqual([]);
    await expect(CalendarNext.listEvents()).resolves.toEqual([]);
    expect(CalendarNext.getSourcesSync()).toEqual([]);
    for (const method of ['getDefaultCalendar', 'getCalendarById', 'presentPicker', 'getEventById', 'getReminderById'] as const) {
      expect(() => CalendarNext[method]()).toThrow(new RegExp(`Calendar\\.${method}`));
    }
    for (const Entry of [CalendarNext.ExpoCalendar, CalendarNext.ExpoCalendarEvent, CalendarNext.ExpoCalendarAttendee, CalendarNext.ExpoCalendarReminder]) {
      expect(() => new Entry()).toThrow(new RegExp(`Calendar\\.${Entry.name}`));
    }
  });
});

describe('the contacts modules (windows)', () => {
  it('deny the permissions and give the package a Contact with an id and no store behind it', async () => {
    await expect(ExpoContacts.getPermissionsAsync()).resolves.toBe(DENIED);
    await expect(ExpoContacts.requestPermissionsAsync()).resolves.toBe(DENIED);
    await expect(ExpoContactsNext.getPermissionsAsync()).resolves.toBe(DENIED);
    await expect(ExpoContactsNext.requestPermissionsAsync()).resolves.toBe(DENIED);
    expect(new ExpoContactsNext.Contact('c1')).toBeInstanceOf(Contact);
    expect(new Contact('c1').id).toBe('c1');
    const subscription = ExpoContactsNext.addListener();
    expect(() => subscription.remove()).not.toThrow();
    expect(() => ExpoContactsNext.removeListener()).not.toThrow();
    expect(() => ExpoContactsNext.removeAllListeners()).not.toThrow();
    expect(() => ExpoContactsNext.emit()).not.toThrow();
    expect(ExpoContactsNext.listenerCount()).toBe(0);
  });
});
