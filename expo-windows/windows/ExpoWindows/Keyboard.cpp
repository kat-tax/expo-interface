#include "pch.h"

#include "Common.h"

#include <NativeModules.h>

using namespace winrt;
using namespace winrt::Microsoft::ReactNative;
using namespace winrt::Windows::Foundation;
using namespace winrt::Windows::UI::ViewManagement;
using namespace ExpoWindows;

namespace {

/** The window's input pane — the touch keyboard's — through the interop factory, since a Win32 window has no CoreWindow. */
InputPane PaneForMainWindow() {
  HWND window = MainWindow();
  if (!window) throw hresult_error(E_FAIL, L"The app has no window yet");
  auto interop = winrt::get_activation_factory<InputPane, IInputPaneInterop>();
  InputPane pane{nullptr};
  check_hresult(interop->GetForWindow(window, guid_of<InputPane>(), put_abi(pane)));
  return pane;
}

/** A keyboard event's metrics, as React Native's `Keyboard` reports them: the pane's rectangle in the window, in points. */
JSValueObject Metrics(Rect const &rect) {
  return JSValueObject{
      {"screenX", rect.X},
      {"screenY", rect.Y},
      {"width", rect.Width},
      {"height", rect.Height},
  };
}

} // namespace

/**
 * `ExpoWindowsKeyboard`: the touch keyboard. Its showing and hiding reach
 * JavaScript as React Native's own `keyboardDidShow` and `keyboardDidHide`
 * — with the rectangle it covers in the window — so `Keyboard.addListener`
 * and everything built on it work on Windows; `show` and `hide` ask for it.
 */
REACT_MODULE(ExpoWindowsKeyboard)
struct ExpoWindowsKeyboard {
  REACT_INIT(Initialize)
  void Initialize(ReactContext const &context) noexcept {
    m_context = context;
    context.UIDispatcher().Post([this] { Observe(); });
  }

  REACT_METHOD(Show, L"show")
  void Show(ReactPromise<bool> promise) noexcept {
    m_context.UIDispatcher().Post([this, promise] {
      try {
        promise.Resolve(Pane().TryShow());
      } catch (hresult_error const &error) {
        promise.Reject(Message(error).c_str());
      }
    });
  }

  REACT_METHOD(Hide, L"hide")
  void Hide(ReactPromise<bool> promise) noexcept {
    m_context.UIDispatcher().Post([this, promise] {
      try {
        promise.Resolve(Pane().TryHide());
      } catch (hresult_error const &error) {
        promise.Reject(Message(error).c_str());
      }
    });
  }

  REACT_METHOD(GetState, L"getState")
  void GetState(ReactPromise<JSValue> promise) noexcept {
    m_context.UIDispatcher().Post([this, promise] {
      try {
        auto &pane = Pane();
        promise.Resolve(JSValueObject{{"visible", pane.Visible()}, {"height", pane.OccludedRect().Height}});
      } catch (hresult_error const &error) {
        promise.Reject(Message(error).c_str());
      }
    });
  }

 private:
  /** The pane, found on first use and observed from then on. */
  InputPane &Pane() {
    if (!m_pane) {
      m_pane = PaneForMainWindow();
      m_showing = m_pane.Showing(winrt::auto_revoke, [this](auto const &, InputPaneVisibilityEventArgs const &args) {
        Emit(L"keyboardDidShow", args.OccludedRect());
      });
      m_hiding = m_pane.Hiding(winrt::auto_revoke, [this](auto const &, InputPaneVisibilityEventArgs const &) {
        Emit(L"keyboardDidHide", Rect{0, 0, 0, 0});
      });
    }
    return m_pane;
  }

  /** Starts observing; the window may not be there yet at the instance's start, so a few tries are spaced out. */
  void Observe() noexcept {
    try {
      Pane();
    } catch (...) {
      if (++m_tries > 20) return;
      try {
        auto queue = winrt::Microsoft::UI::Dispatching::DispatcherQueue::GetForCurrentThread();
        if (!queue) return;
        m_retry = queue.CreateTimer();
        m_retry.Interval(std::chrono::milliseconds(500));
        m_retry.IsRepeating(false);
        m_retry.Tick([this](auto const &, auto const &) { Observe(); });
        m_retry.Start();
      } catch (...) {
        // No timer, then: the pane is found at the first call instead.
      }
    }
  }

  void Emit(wchar_t const *name, Rect const &rect) noexcept {
    m_context.EmitJSEvent(
        L"RCTDeviceEventEmitter", name,
        JSValueObject{{"endCoordinates", Metrics(rect)}, {"duration", 0}, {"easing", "keyboard"}});
  }

  ReactContext m_context;
  InputPane m_pane{nullptr};
  InputPane::Showing_revoker m_showing;
  InputPane::Hiding_revoker m_hiding;
  winrt::Microsoft::UI::Dispatching::DispatcherQueueTimer m_retry{nullptr};
  int m_tries{0};
};
