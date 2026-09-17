import type {NativeModule} from 'expo-modules-core';
import type {NativeCalendar, NativeLocale} from '../native';
import {native} from '../native';
import {nativeModuleClass} from './base';

/** The locale an app sees without the library: English as spoken in the United States, with what cannot be known left null. */
export const FALLBACK_LOCALE: NativeLocale = {
  languageTag: 'en-US',
  languageCode: 'en',
  languageScriptCode: null,
  regionCode: 'US',
  languageRegionCode: 'US',
  currencyCode: null,
  currencySymbol: null,
  languageCurrencyCode: null,
  languageCurrencySymbol: null,
  decimalSeparator: '.',
  digitGroupingSeparator: ',',
  textDirection: 'ltr',
  measurementSystem: null,
  temperatureUnit: null,
};

/** The engine's time zone, when its `Intl` knows it. */
export function engineTimeZone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
  } catch {
    return null;
  }
}

export function fallbackCalendars(): NativeCalendar[] {
  return [{calendar: 'gregory', timeZone: engineTimeZone(), uses24hourClock: null, firstWeekday: null}];
}

export interface ExpoLocalizationModule extends InstanceType<NativeModule> {
  getLocales(): NativeLocale[];
  getCalendars(): NativeCalendar[];
}

/**
 * `ExpoLocalization`, what `expo-localization` reads: the user's languages
 * in the order of their settings and the home region (`GlobalizationPreferences`),
 * each language's separators, currency, reading direction and measurement
 * system from the locale data, and the calendar, the clock, the first
 * weekday and the IANA time zone — through the runtime's library. The
 * settings are read at each call; Windows raises no event for a change,
 * so the hooks rerender only on their own. The members are the module's
 * own, since the package takes them off it unbound.
 */
export function createLocalizationModule(): ExpoLocalizationModule {
  const Base = nativeModuleClass();
  class Module extends Base implements ExpoLocalizationModule {
    readonly getLocales = (): NativeLocale[] => {
      const locales = native.localization()?.getLocales();
      return locales?.length ? locales : [FALLBACK_LOCALE];
    };
    readonly getCalendars = (): NativeCalendar[] => {
      const calendars = native.localization()?.getCalendars();
      return calendars?.length ? calendars : fallbackCalendars();
    };
  }
  return new Module();
}
