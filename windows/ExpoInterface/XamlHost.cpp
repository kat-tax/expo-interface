#include "pch.h"

#ifdef RNW_NEW_ARCH

#include "XamlHost.h"

#if __has_include(<winrt/Microsoft.ReactNative.Xaml.h>)
#include <winrt/Microsoft.ReactNative.Xaml.h>
#endif

namespace winrt::ExpoInterface {

// -- Colors ------------------------------------------------------------------

static int HexDigit(char c) noexcept {
  if (c >= '0' && c <= '9') return c - '0';
  if (c >= 'a' && c <= 'f') return c - 'a' + 10;
  if (c >= 'A' && c <= 'F') return c - 'A' + 10;
  return -1;
}

bool TryParseColor(std::string_view hex, Color &color) noexcept {
  if (!hex.empty() && hex.front() == '#') hex.remove_prefix(1);
  std::string digits;
  if (hex.size() == 3 || hex.size() == 4) {
    for (char c : hex) {
      digits.push_back(c);
      digits.push_back(c);
    }
  } else if (hex.size() == 6 || hex.size() == 8) {
    digits.assign(hex);
  } else {
    return false;
  }
  uint8_t bytes[4] = {0, 0, 0, 255};
  for (size_t i = 0; i < digits.size() / 2; ++i) {
    int high = HexDigit(digits[i * 2]);
    int low = HexDigit(digits[i * 2 + 1]);
    if (high < 0 || low < 0) return false;
    bytes[i] = static_cast<uint8_t>(high * 16 + low);
  }
  color = Color{bytes[3], bytes[0], bytes[1], bytes[2]};
  return true;
}

void OverrideBrushes(const xaml::FrameworkElement &element, std::initializer_list<const wchar_t *> keys, Color color) noexcept {
  auto resources = element.Resources();
  for (auto key : keys) {
    resources.Insert(winrt::box_value(key), Brush(color));
  }
}

xaml::Style AccentButtonStyle() noexcept {
  try {
    auto resources = xaml::Application::Current().Resources();
    if (auto style = resources.TryLookup(winrt::box_value(L"AccentButtonStyle"))) {
      return style.as<xaml::Style>();
    }
  } catch (...) {
  }
  return nullptr;
}

Color SystemAccent() noexcept {
  try {
    winrt::Windows::UI::ViewManagement::UISettings settings;
    return settings.GetColorValue(winrt::Windows::UI::ViewManagement::UIColorType::Accent);
  } catch (...) {
    return Color{255, 0, 0x78, 0xD4};
  }
}

Color ColorOr(const std::optional<std::string> &hex, Color fallback) noexcept {
  Color color;
  if (hex && TryParseColor(*hex, color)) return color;
  return fallback;
}

media::SolidColorBrush Brush(Color color) noexcept {
  return media::SolidColorBrush{color};
}

media::SolidColorBrush Brush(Color color, float opacity) noexcept {
  auto brush = media::SolidColorBrush{color};
  brush.Opacity(opacity);
  return brush;
}

Color Mix(Color color, Color toward, float amount) noexcept {
  auto channel = [amount](uint8_t from, uint8_t to) {
    return static_cast<uint8_t>(std::lround(from + (to - from) * amount));
  };
  return Color{color.A, channel(color.R, toward.R), channel(color.G, toward.G), channel(color.B, toward.B)};
}

bool IsLight(Color color) noexcept {
  return 0.299 * color.R + 0.587 * color.G + 0.114 * color.B > 153;
}

Color Critical(bool dark) noexcept {
  return dark ? Color{255, 0xFF, 0x99, 0xA4} : Color{255, 0xC4, 0x2B, 0x1C};
}

std::string ToHex(Color color, bool alpha) noexcept {
  char buffer[12];
  if (alpha) {
    snprintf(buffer, sizeof buffer, "#%02X%02X%02X%02X", color.R, color.G, color.B, color.A);
  } else {
    snprintf(buffer, sizeof buffer, "#%02X%02X%02X", color.R, color.G, color.B);
  }
  return buffer;
}

// -- Strings -----------------------------------------------------------------

winrt::hstring ToHString(std::string_view utf8) noexcept {
  if (utf8.empty()) return {};
  int length = MultiByteToWideChar(CP_UTF8, 0, utf8.data(), static_cast<int>(utf8.size()), nullptr, 0);
  if (length <= 0) return {};
  std::wstring wide(static_cast<size_t>(length), L'\0');
  MultiByteToWideChar(CP_UTF8, 0, utf8.data(), static_cast<int>(utf8.size()), wide.data(), length);
  return winrt::hstring{wide};
}

std::string ToUtf8(const winrt::hstring &text) noexcept {
  if (text.empty()) return {};
  int length = WideCharToMultiByte(CP_UTF8, 0, text.c_str(), static_cast<int>(text.size()), nullptr, 0, nullptr, nullptr);
  if (length <= 0) return {};
  std::string utf8(static_cast<size_t>(length), '\0');
  WideCharToMultiByte(CP_UTF8, 0, text.c_str(), static_cast<int>(text.size()), utf8.data(), length, nullptr, nullptr);
  return utf8;
}

winrt::hstring GlyphFromCodePoint(std::string_view hex) noexcept {
  if (hex.empty()) return {};
  unsigned long codePoint = std::strtoul(std::string(hex).c_str(), nullptr, 16);
  if (codePoint == 0 || codePoint > 0xFFFF) return {};
  wchar_t glyph[2] = {static_cast<wchar_t>(codePoint), L'\0'};
  return winrt::hstring{glyph};
}

controls::FontIcon MakeGlyph(std::string_view hex, double size) noexcept {
  controls::FontIcon icon;
  icon.FontFamily(media::FontFamily{L"Segoe Fluent Icons,Segoe MDL2 Assets"});
  icon.Glyph(GlyphFromCodePoint(hex));
  icon.FontSize(size);
  return icon;
}

// -- Theme and accent --------------------------------------------------------

xaml::ElementTheme ThemeFrom(const std::optional<std::string> &theme) noexcept {
  if (theme == "dark") return xaml::ElementTheme::Dark;
  if (theme == "light") return xaml::ElementTheme::Light;
  return xaml::ElementTheme::Default;
}

bool IsDark(const xaml::FrameworkElement &element) noexcept {
  return element.ActualTheme() == xaml::ElementTheme::Dark;
}

void ApplyAccent(const xaml::FrameworkElement &element, const std::optional<std::string> &accent) noexcept {
  Color seed;
  if (!accent || !TryParseColor(*accent, seed)) return;
  const Color black{255, 0, 0, 0};
  const Color white{255, 255, 255, 255};
  // WinUI's accent shades: the system computes six from the accent, which the
  // theme dictionaries pick their brushes from — the darker ones in light
  // mode, the lighter ones in dark mode.
  const Color dark1 = Mix(seed, black, 0.25f);
  const Color dark2 = Mix(seed, black, 0.45f);
  const Color dark3 = Mix(seed, black, 0.68f);
  const Color light1 = Mix(seed, white, 0.10f);
  const Color light2 = Mix(seed, white, 0.27f);
  const Color light3 = Mix(seed, white, 0.48f);

  auto dictionary = [&](Color fill, Color textPrimary, Color textSecondary, Color textTertiary) {
    xaml::ResourceDictionary resources;
    auto brush = [&](const wchar_t *key, media::SolidColorBrush value) {
      resources.Insert(winrt::box_value(key), value);
    };
    auto color = [&](const wchar_t *key, Color value) {
      resources.Insert(winrt::box_value(key), winrt::box_value(value));
    };
    brush(L"AccentFillColorDefaultBrush", Brush(fill));
    brush(L"AccentFillColorSecondaryBrush", Brush(fill, 0.9f));
    brush(L"AccentFillColorTertiaryBrush", Brush(fill, 0.8f));
    brush(L"AccentFillColorSelectedTextBackgroundBrush", Brush(seed));
    brush(L"AccentTextFillColorPrimaryBrush", Brush(textPrimary));
    brush(L"AccentTextFillColorSecondaryBrush", Brush(textSecondary));
    brush(L"AccentTextFillColorTertiaryBrush", Brush(textTertiary));
    color(L"AccentFillColorDefault", fill);
    color(L"SystemAccentColor", seed);
    color(L"SystemAccentColorLight1", light1);
    color(L"SystemAccentColorLight2", light2);
    color(L"SystemAccentColorLight3", light3);
    color(L"SystemAccentColorDark1", dark1);
    color(L"SystemAccentColorDark2", dark2);
    color(L"SystemAccentColorDark3", dark3);
    return resources;
  };

  auto themes = element.Resources().ThemeDictionaries();
  themes.Insert(winrt::box_value(L"Light"), dictionary(dark1, dark2, dark3, dark1));
  themes.Insert(winrt::box_value(L"Default"), dictionary(light2, light3, light3, light2));
}

/**
 * Whether the process lays its windows out right to left — what an RTL
 * language makes of every window, and what react-native-windows mirrors its
 * layout by (its `I18nManager` reads the same). An island's XAML does not
 * inherit it: it is set on each island's root.
 */
bool IsRightToLeft() noexcept {
  DWORD layout = 0;
  return GetProcessDefaultLayout(&layout) && (layout & LAYOUT_RTL) != 0;
}

void ApplyLook(
    const xaml::FrameworkElement &element,
    const std::optional<std::string> &theme,
    const std::optional<std::string> &accent) noexcept {
  element.FlowDirection(IsRightToLeft() ? xaml::FlowDirection::RightToLeft : xaml::FlowDirection::LeftToRight);
  ApplyAccent(element, accent);
  // Set last: a theme change is what makes the tree resolve its theme
  // resources again, so the accent above is picked up.
  auto requested = ThemeFrom(theme);
  if (element.RequestedTheme() == requested && requested != xaml::ElementTheme::Default) {
    // The same theme again would not re-resolve; flip through the other one.
    element.RequestedTheme(requested == xaml::ElementTheme::Dark ? xaml::ElementTheme::Light : xaml::ElementTheme::Dark);
  }
  element.RequestedTheme(requested);
}

void SetName(const xaml::UIElement &element, const std::optional<std::string> &label) noexcept {
  if (!label) return;
  xaml::Automation::AutomationProperties::SetName(element, ToHString(*label));
}

// -- JSON --------------------------------------------------------------------

winrt::Windows::Data::Json::JsonArray ParseArray(const std::string &json) noexcept {
  winrt::Windows::Data::Json::JsonArray array;
  if (winrt::Windows::Data::Json::JsonArray::TryParse(ToHString(json), array)) return array;
  return winrt::Windows::Data::Json::JsonArray{};
}

std::string JsonString(const winrt::Windows::Data::Json::JsonObject &object, const wchar_t *key) noexcept {
  auto value = object.TryLookup(key);
  if (!value || value.ValueType() != winrt::Windows::Data::Json::JsonValueType::String) return {};
  return ToUtf8(value.GetString());
}

bool JsonBool(const winrt::Windows::Data::Json::JsonObject &object, const wchar_t *key) noexcept {
  auto value = object.TryLookup(key);
  return value && value.ValueType() == winrt::Windows::Data::Json::JsonValueType::Boolean && value.GetBoolean();
}

std::vector<std::string> JsonStrings(const winrt::Windows::Data::Json::JsonArray &array) noexcept {
  std::vector<std::string> strings;
  for (auto value : array) {
    strings.push_back(value.ValueType() == winrt::Windows::Data::Json::JsonValueType::String ? ToUtf8(value.GetString()) : std::string{});
  }
  return strings;
}

// -- Native layout -----------------------------------------------------------

void ConfigureNativeLayout(const composition::IReactCompositionViewComponentBuilder &builder) noexcept {
  auto viewBuilder = builder.as<rn::IReactViewComponentBuilder>();
  viewBuilder.SetInitialStateDataFactory([](const rn::IComponentProps &) noexcept {
    return winrt::make<DesiredSizeState>(Size{0, 0});
  });
  viewBuilder.SetMeasureContentHandler(
      [](rn::ShadowNode shadowNode, rn::LayoutContext layoutContext, rn::LayoutConstraints constraints) noexcept {
        Size desired{0, 0};
        if (auto data = shadowNode.StateData()) {
          if (auto state = winrt::get_self<DesiredSizeState>(data)) {
            desired = state->desiredSize;
          }
        }
        // Whole pixels, rounded up, so nothing is truncated by pixel snapping.
        const float scale = layoutContext.PointScaleFactor() > 0 ? layoutContext.PointScaleFactor() : 1.0f;
        auto snap = [scale](float value) { return std::ceil(value * scale) / scale; };
        auto clamp = [](float value, float low, float high) {
          if (high < low) high = low;
          return std::min(std::max(value, low), high);
        };
        return Size{
            clamp(snap(desired.Width), constraints.MinimumSize.Width, constraints.MaximumSize.Width),
            clamp(snap(desired.Height), constraints.MinimumSize.Height, constraints.MaximumSize.Height),
        };
      });
}

void EnsureXaml() noexcept {
  // Islands are created on the UI thread, so one process-wide flag is enough.
  static bool ready = false;
  if (ready) return;
  try {
    if (xaml::Application::Current()) {
      ready = true;
      return;
    }
  } catch (...) {
    // No application yet: WinUI reports it as an error rather than a null.
  }
#if __has_include(<winrt/Microsoft.ReactNative.Xaml.h>)
  try {
    // react-native-windows' own application: initializes XAML for the
    // thread and merges the WinUI control resources. Kept alive for the
    // life of the process, like an app's own Application object.
    static winrt::Microsoft::ReactNative::Xaml::XamlApplication application{nullptr};
    application = winrt::Microsoft::ReactNative::Xaml::XamlApplication::Current();
    if (!application) application = winrt::Microsoft::ReactNative::Xaml::XamlApplication{};
    ready = true;
    return;
  } catch (...) {
    // Fall through to plain WinUI hosting.
  }
#endif
  try {
    // WinUI's own thread initializer, plus the control resources a XAML
    // application would normally merge from its App.xaml.
    static xaml::Hosting::WindowsXamlManager manager{nullptr};
    manager = xaml::Hosting::WindowsXamlManager::InitializeForCurrentThread();
    if (auto application = xaml::Application::Current()) {
      application.Resources().MergedDictionaries().Append(controls::XamlControlsResources{});
    }
    ready = true;
  } catch (...) {
    // Without XAML the island initializer fails loudly, which is the honest outcome.
  }
}

} // namespace winrt::ExpoInterface

#endif // RNW_NEW_ARCH
