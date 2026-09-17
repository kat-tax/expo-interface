import {TurboModuleRegistry} from 'react-native';
import {createLocalizationModule, engineTimeZone, FALLBACK_LOCALE, fallbackCalendars} from './localization';

const LOCALE = {...FALLBACK_LOCALE, languageTag: 'de-AT', languageCode: 'de', regionCode: 'AT', languageRegionCode: 'AT', currencyCode: 'EUR', currencySymbol: '€', decimalSeparator: ',', digitGroupingSeparator: '.'};
const CALENDAR = {calendar: 'gregory', timeZone: 'Europe/Vienna', uses24hourClock: true, firstWeekday: 2};

describe('ExpoLocalization (windows)', () => {
  it('reads the locales and the calendars through the library, unbound as the package takes them', () => {
    const library = {getLocales: vi.fn(() => [LOCALE]), getCalendars: vi.fn(() => [CALENDAR])};
    vi.spyOn(TurboModuleRegistry, 'get').mockImplementation(name => (name === 'ExpoWindowsLocalization' ? library : null) as never);
    const {getLocales, getCalendars} = createLocalizationModule();
    expect(getLocales()).toEqual([LOCALE]);
    expect(getCalendars()).toEqual([CALENDAR]);
  });

  it('answers with a locale and a calendar even when the library has none, and without the library', () => {
    vi.spyOn(TurboModuleRegistry, 'get').mockImplementation(name => (name === 'ExpoWindowsLocalization' ? {getLocales: () => [], getCalendars: () => []} : null) as never);
    const module = createLocalizationModule();
    expect(module.getLocales()).toEqual([FALLBACK_LOCALE]);
    expect(module.getCalendars()).toEqual(fallbackCalendars());
    vi.spyOn(TurboModuleRegistry, 'get').mockReturnValue(null);
    expect(createLocalizationModule().getLocales()[0].languageTag).toBe('en-US');
    expect(createLocalizationModule().getCalendars()[0].calendar).toBe('gregory');
  });

  it('takes the time zone from the engine when its Intl knows it', () => {
    const resolvedOptions = vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions');
    resolvedOptions.mockReturnValue({timeZone: 'America/Chicago'} as never);
    expect(engineTimeZone()).toBe('America/Chicago');
    expect(fallbackCalendars()[0].timeZone).toBe('America/Chicago');
    resolvedOptions.mockReturnValue({} as never);
    expect(engineTimeZone()).toBeNull();
    resolvedOptions.mockImplementation(() => {
      throw new Error('no Intl');
    });
    expect(engineTimeZone()).toBeNull();
  });
});
