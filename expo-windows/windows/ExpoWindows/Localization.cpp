#include "pch.h"

#include "Common.h"

#include <NativeModules.h>

using namespace winrt;
using namespace winrt::Microsoft::ReactNative;
using namespace winrt::Windows::Globalization;
using namespace winrt::Windows::Globalization::NumberFormatting;
using namespace winrt::Windows::System::UserProfile;
using namespace ExpoWindows;

namespace {

/** A locale's data by name (`en-US`), from the system's locale tables. */
std::wstring LocaleInfo(std::wstring const &locale, LCTYPE type) {
  wchar_t buffer[128]{};
  int length = GetLocaleInfoEx(locale.c_str(), type, buffer, 128);
  return length > 0 ? std::wstring(buffer, length - 1) : std::wstring{};
}

/** Text, or null for none. */
JSValue Text(std::wstring const &value) {
  return value.empty() ? JSValue(nullptr) : JSValue(ToUtf8(value));
}

/** The parts of a BCP 47 tag: the language, a four-letter script and a two-letter or three-digit region, when they are in it. */
struct Tag {
  std::wstring language, script, region;
};

Tag Parse(std::wstring const &tag) {
  Tag parts;
  size_t start = 0;
  bool first = true;
  while (start <= tag.size()) {
    size_t end = tag.find(L'-', start);
    if (end == std::wstring::npos) end = tag.size();
    std::wstring part = tag.substr(start, end - start);
    if (first) {
      parts.language = part;
      first = false;
    } else if (part.size() == 4 && parts.script.empty() && std::all_of(part.begin(), part.end(), iswalpha)) {
      parts.script = part;
    } else if (parts.region.empty() && ((part.size() == 2 && std::all_of(part.begin(), part.end(), iswalpha)) || (part.size() == 3 && std::all_of(part.begin(), part.end(), iswdigit)))) {
      parts.region = part;
      std::transform(parts.region.begin(), parts.region.end(), parts.region.begin(), towupper);
    }
    start = end + 1;
  }
  return parts;
}

/** The currency of a region (ISO 4217), or none. */
std::wstring CurrencyOf(std::wstring const &region) {
  if (region.empty()) return {};
  try {
    auto currencies = GeographicRegion(region).CurrenciesInUse();
    return currencies.Size() ? std::wstring(currencies.GetAt(0)) : std::wstring{};
  } catch (...) {
    return {};
  }
}

/** The symbol a currency is written with in a language: what is left of zero formatted as that currency. */
std::wstring SymbolOf(std::wstring const &currency, hstring const &language, std::wstring const &region) {
  if (currency.empty()) return {};
  try {
    auto languages = single_threaded_vector<hstring>({language});
    CurrencyFormatter formatter(currency, languages, region.empty() ? L"ZZ" : region);
    formatter.Mode(CurrencyFormatterMode::UseSymbol);
    formatter.FractionDigits(0);
    formatter.IsGrouped(false);
    std::wstring symbol;
    for (wchar_t c : std::wstring(formatter.Format(0.0))) {
      if (!iswdigit(c) && !iswspace(c) && c != 0x00A0 && c != 0x202F) symbol += c; // the no-break spaces too
    }
    return symbol;
  } catch (...) {
    return {};
  }
}

/** The regions that read the weather in Fahrenheit. */
bool Fahrenheit(std::wstring const &region) {
  return region == L"US" || region == L"BS" || region == L"BZ" || region == L"KY" || region == L"PW";
}

JSValueObject LocaleFor(hstring const &tag, std::wstring const &home) {
  std::wstring name(tag);
  Tag parts = Parse(name);
  std::wstring homeCurrency = CurrencyOf(home);
  std::wstring languageCurrency = CurrencyOf(parts.region);
  bool rtl = LocaleInfo(name, LOCALE_IREADINGLAYOUT) == L"1";
  bool us = LocaleInfo(name, LOCALE_IMEASURE) == L"1";
  return JSValueObject{
      {"languageTag", ToUtf8(name)},
      {"languageCode", Text(parts.language)},
      {"languageScriptCode", Text(parts.script)},
      {"regionCode", Text(home)},
      {"languageRegionCode", Text(parts.region)},
      {"currencyCode", Text(homeCurrency)},
      {"currencySymbol", Text(SymbolOf(homeCurrency, tag, home))},
      {"languageCurrencyCode", Text(languageCurrency)},
      {"languageCurrencySymbol", Text(SymbolOf(languageCurrency, tag, parts.region))},
      {"decimalSeparator", Text(LocaleInfo(name, LOCALE_SDECIMAL))},
      {"digitGroupingSeparator", Text(LocaleInfo(name, LOCALE_STHOUSAND))},
      {"textDirection", rtl ? "rtl" : "ltr"},
      {"measurementSystem", home == L"GB" ? "uk" : us ? "us" : "metric"},
      {"temperatureUnit", Fahrenheit(home) ? "fahrenheit" : "celsius"},
  };
}

/** The Unicode calendar identifier for a Windows calendar name, or null for one without. */
JSValue CalendarId(hstring const &windows) {
  static constexpr std::pair<wchar_t const *, char const *> names[] = {
      {L"GregorianCalendar", "gregory"},         {L"JulianCalendar", "gregory"},     {L"HebrewCalendar", "hebrew"},
      {L"HijriCalendar", "islamic"},             {L"UmAlQuraCalendar", "islamic-umalqura"}, {L"JapaneseCalendar", "japanese"},
      {L"KoreanCalendar", "dangi"},              {L"TaiwanCalendar", "roc"},         {L"ThaiCalendar", "buddhist"},
      {L"PersianCalendar", "persian"},           {L"ChineseLunarCalendar", "chinese"}, {L"VietnameseLunarCalendar", "chinese"},
  };
  for (auto const &[name, id] : names) {
    if (windows == name) return JSValue(id);
  }
  return JSValue(nullptr);
}

/** The IANA name of the system's time zone, through ICU's Windows-to-IANA table, or the Windows name when ICU has none. */
std::string TimeZoneId(std::wstring const &region) {
  DYNAMIC_TIME_ZONE_INFORMATION zone{};
  GetDynamicTimeZoneInformation(&zone);
  std::wstring key(zone.TimeZoneKeyName);
  std::string regionUtf8 = ToUtf8(region);
  UChar buffer[128]{};
  UErrorCode status = U_ZERO_ERROR;
  int32_t length = ucal_getTimeZoneIDForWindowsID(reinterpret_cast<UChar const *>(key.c_str()), -1, region.empty() ? nullptr : regionUtf8.c_str(), buffer, 128, &status);
  if (U_FAILURE(status) || length <= 0) {
    status = U_ZERO_ERROR;
    length = ucal_getTimeZoneIDForWindowsID(reinterpret_cast<UChar const *>(key.c_str()), -1, nullptr, buffer, 128, &status);
  }
  if (U_FAILURE(status) || length <= 0) return ToUtf8(key);
  return ToUtf8(std::wstring(reinterpret_cast<wchar_t const *>(buffer), static_cast<size_t>(length)));
}

} // namespace

/**
 * `ExpoWindowsLocalization`: what `expo-localization` reads — the user's
 * languages in the order of their settings and the home region
 * (`GlobalizationPreferences`), each language's separators, currency,
 * reading direction and measurement system from the system's locale data,
 * and the calendar, the clock, the first weekday and the time zone. All
 * of it is read at the call; Windows raises no event for a change.
 */
REACT_MODULE(ExpoWindowsLocalization)
struct ExpoWindowsLocalization {
  REACT_SYNC_METHOD(GetLocales, L"getLocales")
  JSValue GetLocales() noexcept {
    try {
      std::wstring home(GlobalizationPreferences::HomeGeographicRegion());
      JSValueArray locales;
      for (auto const &tag : GlobalizationPreferences::Languages()) locales.push_back(LocaleFor(tag, home));
      if (locales.empty()) locales.push_back(LocaleFor(L"en-US", home));
      return locales;
    } catch (...) {
      return JSValueArray{};
    }
  }

  REACT_SYNC_METHOD(GetCalendars, L"getCalendars")
  JSValue GetCalendars() noexcept {
    try {
      auto calendars = GlobalizationPreferences::Calendars();
      auto clocks = GlobalizationPreferences::Clocks();
      std::wstring home(GlobalizationPreferences::HomeGeographicRegion());
      return JSValueArray{JSValueObject{
          {"calendar", calendars.Size() ? CalendarId(calendars.GetAt(0)) : JSValue(nullptr)},
          {"timeZone", TimeZoneId(home)},
          {"uses24hourClock", clocks.Size() ? JSValue(std::wstring(clocks.GetAt(0)) == L"24HourClock") : JSValue(nullptr)},
          {"firstWeekday", static_cast<int>(GlobalizationPreferences::WeekStartsOn()) + 1},
      }};
    } catch (...) {
      return JSValueArray{};
    }
  }
};
