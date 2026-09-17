#include "pch.h"

#include "Common.h"

#include <NativeModules.h>

using namespace winrt;
using namespace winrt::Microsoft::ReactNative;
using namespace winrt::Windows::UI::ViewManagement;
using namespace ExpoWindows;

namespace {

/** A system colour as CSS hex, the form the kit's palette takes. */
std::string Hex(winrt::Windows::UI::Color const &color) noexcept {
  char text[8];
  std::snprintf(text, sizeof text, "#%02X%02X%02X", color.R, color.G, color.B);
  return text;
}

/** The system's colours for the parts of a window: the high contrast theme's while one is on. */
JSValueObject SystemColors() {
  UISettings settings;
  auto of = [&settings](UIElementType type) { return Hex(settings.UIElementColor(type)); };
  return JSValueObject{
      {"background", of(UIElementType::Window)},
      {"text", of(UIElementType::WindowText)},
      {"highlight", of(UIElementType::Highlight)},
      {"highlightText", of(UIElementType::HighlightText)},
      {"buttonFace", of(UIElementType::ButtonFace)},
      {"buttonText", of(UIElementType::ButtonText)},
      {"link", of(UIElementType::Hotlight)},
      {"disabledText", of(UIElementType::GrayText)},
  };
}

/** Whether a high contrast theme is on, its name, and the system colours as they stand. */
JSValueObject HighContrastState() {
  AccessibilitySettings accessibility;
  return JSValueObject{
      {"enabled", accessibility.HighContrast()},
      {"scheme", ToUtf8(accessibility.HighContrastScheme())},
      {"colors", SystemColors()},
  };
}

} // namespace

/**
 * `ExpoWindowsAccessibility`: the system's high contrast setting, the
 * colours its theme paints the window with, and a change event when the
 * user turns it on or off, from `AccessibilitySettings` and `UISettings`.
 */
REACT_MODULE(ExpoWindowsAccessibility)
struct ExpoWindowsAccessibility {
  REACT_INIT(Initialize)
  void Initialize(ReactContext const &context) noexcept {
    m_context = context;
    // The settings object raises its event on the thread that made it; the UI thread keeps it.
    context.UIDispatcher().Post([this] {
      try {
        m_settings = AccessibilitySettings();
        m_changed = m_settings.HighContrastChanged(winrt::auto_revoke, [this](auto const &, auto const &) {
          auto emit = OnHighContrastChanged;
          m_context.UIDispatcher().Post([emit] {
            try {
              emit(HighContrastState());
            } catch (...) {
              // The state could not be read this time; the next change tries again.
            }
          });
        });
      } catch (...) {
        // No change events, then; asking still works.
      }
    });
  }

  REACT_EVENT(OnHighContrastChanged, L"onHighContrastChanged")
  std::function<void(JSValue)> OnHighContrastChanged;

  REACT_METHOD(GetHighContrast, L"getHighContrast")
  void GetHighContrast(ReactPromise<JSValue> promise) noexcept {
    try {
      promise.Resolve(HighContrastState());
    } catch (hresult_error const &error) {
      promise.Reject(Message(error).c_str());
    }
  }

 private:
  ReactContext m_context;
  AccessibilitySettings m_settings{nullptr};
  AccessibilitySettings::HighContrastChanged_revoker m_changed;
};
