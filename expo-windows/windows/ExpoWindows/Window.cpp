#include "pch.h"

#include <NativeModules.h>

#include "Common.h"

using namespace winrt::Microsoft::ReactNative;
using namespace winrt::Microsoft::UI::Windowing;
using Rgba = winrt::Windows::UI::Color;

namespace ExpoWindows {

namespace {

/** The app's window as the Windows App SDK sees it, or null before it exists. */
AppWindow AppWindowOf(HWND window) noexcept {
  try {
    return AppWindow::GetFromWindowId(winrt::Microsoft::UI::GetWindowIdFromWindow(window));
  } catch (...) {
    return nullptr;
  }
}

/** Physical pixels per point for the window. */
double ScaleOf(HWND window) noexcept {
  const auto dpi = GetDpiForWindow(window);
  return dpi > 0 ? dpi / 96.0 : 1.0;
}

/** `#RGB`, `#RRGGBB` or `#RRGGBBAA`; false for anything else. */
bool ParseColor(std::string_view hex, Rgba &color) noexcept {
  if (hex.empty() || hex.front() != '#') return false;
  const auto digits = hex.substr(1);
  if (digits.size() != 3 && digits.size() != 6 && digits.size() != 8) return false;
  uint32_t value = 0;
  for (auto c : digits) {
    const auto lower = static_cast<char>(std::tolower(static_cast<unsigned char>(c)));
    const int digit = lower >= '0' && lower <= '9' ? lower - '0' : lower >= 'a' && lower <= 'f' ? 10 + lower - 'a' : -1;
    if (digit < 0) return false;
    value = (value << 4) | static_cast<uint32_t>(digit);
  }
  if (digits.size() == 3) {
    const auto r = static_cast<uint8_t>((value >> 8) & 0xF), g = static_cast<uint8_t>((value >> 4) & 0xF), b = static_cast<uint8_t>(value & 0xF);
    color = Rgba{255, static_cast<uint8_t>(r * 17), static_cast<uint8_t>(g * 17), static_cast<uint8_t>(b * 17)};
  } else if (digits.size() == 6) {
    color = Rgba{255, static_cast<uint8_t>(value >> 16), static_cast<uint8_t>(value >> 8), static_cast<uint8_t>(value)};
  } else {
    color = Rgba{static_cast<uint8_t>(value), static_cast<uint8_t>(value >> 24), static_cast<uint8_t>(value >> 16), static_cast<uint8_t>(value >> 8)};
  }
  return true;
}

JSValueObject Insets(double left, double right, double height) {
  return JSValueObject{{"left", left}, {"right", right}, {"height", height}};
}

/** The brush this module gave the window's class, to free when it changes. */
HBRUSH g_background = nullptr;

} // namespace

/**
 * `ExpoWindowsWindow`: the app's window, for what a desktop app sets on it
 * — its title, which the kit's stack keeps at the focused screen's; its
 * chrome, the content extended into the title bar with the caption buttons
 * over it and a drag region the kit's header reports; its background.
 */
REACT_MODULE(ExpoWindowsWindow)
struct ExpoWindowsWindow {
  REACT_INIT(Initialize)
  void Initialize(ReactContext const &context) noexcept {
    m_context = context;
  }

  REACT_METHOD(SetTitle, L"setTitle")
  void SetTitle(std::string title) noexcept {
    m_context.UIDispatcher().Post([title = ToWide(title)] {
      if (auto window = MainWindow()) SetWindowTextW(window, title.c_str());
    });
  }

  REACT_METHOD(GetTitle, L"getTitle")
  void GetTitle(ReactPromise<std::string> promise) noexcept {
    m_context.UIDispatcher().Post([promise] {
      auto window = MainWindow();
      if (!window) {
        promise.Resolve("");
        return;
      }
      std::wstring text(static_cast<size_t>(GetWindowTextLengthW(window)) + 1, L'\0');
      const int length = GetWindowTextW(window, text.data(), static_cast<int>(text.size()));
      text.resize(static_cast<size_t>(std::max(length, 0)));
      promise.Resolve(ToUtf8(text));
    });
  }

  /**
   * Extends the content into the title bar (or takes it back), with the
   * caption buttons drawn transparent in the scheme's foreground; resolves
   * false where the Windows App SDK cannot customize the title bar.
   */
  REACT_METHOD(SetChrome, L"setChrome")
  void SetChrome(bool extend, std::string theme, ReactPromise<bool> promise) noexcept {
    m_context.UIDispatcher().Post([extend, theme, promise] {
      try {
        const auto window = MainWindow();
        auto appWindow = window ? AppWindowOf(window) : nullptr;
        if (!appWindow || !AppWindowTitleBar::IsCustomizationSupported()) {
          promise.Resolve(false);
          return;
        }
        auto bar = appWindow.TitleBar();
        bar.ExtendsContentIntoTitleBar(extend);
        if (extend) {
          const bool dark = theme == "dark";
          const Rgba foreground = dark ? Rgba{255, 255, 255, 255} : Rgba{255, 0, 0, 0};
          const Rgba inactive = dark ? Rgba{255, 160, 160, 160} : Rgba{255, 96, 96, 96};
          const Rgba hover = dark ? Rgba{25, 255, 255, 255} : Rgba{25, 0, 0, 0};
          const Rgba pressed = dark ? Rgba{15, 255, 255, 255} : Rgba{15, 0, 0, 0};
          bar.ButtonBackgroundColor(Rgba{0, 0, 0, 0});
          bar.ButtonInactiveBackgroundColor(Rgba{0, 0, 0, 0});
          bar.ButtonForegroundColor(foreground);
          bar.ButtonInactiveForegroundColor(inactive);
          bar.ButtonHoverBackgroundColor(hover);
          bar.ButtonHoverForegroundColor(foreground);
          bar.ButtonPressedBackgroundColor(pressed);
          bar.ButtonPressedForegroundColor(foreground);
        }
        promise.Resolve(true);
      } catch (winrt::hresult_error const &error) {
        promise.Reject(Message(error).c_str());
      }
    });
  }

  /** The title bar's caption area, in points: what the content extended into it must leave clear. */
  REACT_METHOD(GetTitleBarInsets, L"getTitleBarInsets")
  void GetTitleBarInsets(ReactPromise<JSValue> promise) noexcept {
    m_context.UIDispatcher().Post([promise] {
      try {
        const auto window = MainWindow();
        auto appWindow = window ? AppWindowOf(window) : nullptr;
        if (!appWindow) {
          promise.Resolve(Insets(0, 0, 0));
          return;
        }
        auto bar = appWindow.TitleBar();
        const double scale = ScaleOf(window);
        promise.Resolve(Insets(bar.LeftInset() / scale, bar.RightInset() / scale, bar.Height() / scale));
      } catch (...) {
        promise.Resolve(Insets(0, 0, 0));
      }
    });
  }

  /** The rectangle, in points from the window's top-left, that drags the window when the content is in the title bar. */
  REACT_METHOD(SetDragRegion, L"setDragRegion")
  void SetDragRegion(double x, double y, double width, double height) noexcept {
    m_context.UIDispatcher().Post([x, y, width, height] {
      try {
        const auto window = MainWindow();
        auto appWindow = window ? AppWindowOf(window) : nullptr;
        if (!appWindow) return;
        const double scale = ScaleOf(window);
        const winrt::Windows::Graphics::RectInt32 rect{
            static_cast<int32_t>(x * scale), static_cast<int32_t>(y * scale), static_cast<int32_t>(width * scale), static_cast<int32_t>(height * scale)};
        appWindow.TitleBar().SetDragRectangles({rect});
      } catch (...) {
      }
    });
  }

  /** The window's own background — what shows where nothing is drawn, and while it resizes — or the system's for an empty color. */
  REACT_METHOD(SetBackground, L"setBackground")
  void SetBackground(std::string color) noexcept {
    m_context.UIDispatcher().Post([color] {
      const auto window = MainWindow();
      if (!window) return;
      Rgba parsed{};
      HBRUSH brush = ParseColor(color, parsed) ? CreateSolidBrush(RGB(parsed.R, parsed.G, parsed.B)) : nullptr;
      SetClassLongPtrW(window, GCLP_HBRBACKGROUND, reinterpret_cast<LONG_PTR>(brush));
      if (g_background) DeleteObject(g_background);
      g_background = brush;
      InvalidateRect(window, nullptr, TRUE);
    });
  }

  /**
   * Keeps the window out of screen captures and recordings
   * (`WDA_EXCLUDEFROMCAPTURE`: a capture shows black where it is), or lets
   * it back in; resolves whether the system took it.
   */
  REACT_METHOD(SetCaptureExcluded, L"setCaptureExcluded")
  void SetCaptureExcluded(bool excluded, ReactPromise<bool> promise) noexcept {
    m_context.UIDispatcher().Post([excluded, promise] {
      auto window = MainWindow();
      promise.Resolve(window != nullptr && SetWindowDisplayAffinity(window, excluded ? WDA_EXCLUDEFROMCAPTURE : WDA_NONE) != 0);
    });
  }

 private:
  ReactContext m_context;
};

} // namespace ExpoWindows
