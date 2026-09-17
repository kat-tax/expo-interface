#include "pch.h"

#include <NativeModules.h>

#include "Common.h"

using namespace winrt::Microsoft::ReactNative;
using namespace winrt::Microsoft::Windows::AppLifecycle;
using namespace winrt::Windows::ApplicationModel::Activation;

namespace ExpoWindows {

namespace {

/** The first argument that is a URL, on a plain launch (`app.exe scheme://path`). */
std::string UrlInArguments(winrt::hstring const &arguments) noexcept {
  const auto text = ToUtf8(arguments);
  size_t at = 0;
  while (at < text.size()) {
    const auto end = text.find(' ', at);
    auto token = text.substr(at, end == std::string::npos ? std::string::npos : end - at);
    if (!token.empty() && token.front() == '"' && token.back() == '"' && token.size() > 1) token = token.substr(1, token.size() - 2);
    // A scheme of two letters or more: `W:\app.exe`, the exe's own path, is not a link.
    const auto colon = token.find(':');
    if (colon != std::string::npos && colon > 1 && token.size() > colon + 1 && token[colon + 1] != '\\' &&
        token.rfind("----", 0) != 0 &&
        std::all_of(token.begin(), token.begin() + colon, [](char c) { return std::isalnum(static_cast<unsigned char>(c)) || c == '+' || c == '-' || c == '.'; })) {
      return token;
    }
    if (end == std::string::npos) break;
    at = end + 1;
  }
  return {};
}

/** The URL an activation carries: a protocol activation's, or one passed on the command line. */
std::string UrlOf(AppActivationArguments const &args) noexcept {
  try {
    if (args.Kind() == ExtendedActivationKind::Protocol) {
      if (auto protocol = args.Data().try_as<IProtocolActivatedEventArgs>()) return ToUtf8(protocol.Uri().AbsoluteUri());
    }
    if (args.Kind() == ExtendedActivationKind::Launch) {
      if (auto launch = args.Data().try_as<ILaunchActivatedEventArgs>()) return UrlInArguments(launch.Arguments());
    }
  } catch (...) {
  }
  return {};
}

} // namespace

/**
 * `ExpoWindowsLinking`: deep links on Windows. The app's scheme is
 * registered as a URI protocol for the current user
 * (`ActivationRegistrationManager`, no manifest needed for an unpackaged
 * app); the URL the app was launched with — a protocol activation, or a
 * URL on the command line — is the initial URL; and an activation that
 * reaches the running app (redirected there by the app's single-instance
 * check, which the runtime's `init` writes) is raised as React Native's
 * own `url` event, the one `expo-linking` listens to.
 */
REACT_MODULE(ExpoWindowsLinking)
struct ExpoWindowsLinking {
  REACT_INIT(Initialize)
  void Initialize(ReactContext const &context) noexcept {
    m_context = context;
    try {
      m_activated = AppInstance::GetCurrent().Activated(winrt::auto_revoke, [context](auto const &, AppActivationArguments const &args) {
        const auto url = UrlOf(args);
        if (!url.empty()) context.EmitJSEvent(L"RCTDeviceEventEmitter", L"url", JSValueObject{{"url", url}});
      });
    } catch (...) {
      // Without the Windows App SDK's lifecycle (a packaged app without the capability), links arrive as new instances.
    }
  }

  REACT_METHOD(GetInitialUrl, L"getInitialUrl")
  void GetInitialUrl(ReactPromise<std::string> promise) noexcept {
    try {
      promise.Resolve(UrlOf(AppInstance::GetCurrent().GetActivatedEventArgs()));
    } catch (...) {
      promise.Resolve("");
    }
  }

  REACT_METHOD(RegisterProtocol, L"registerProtocol")
  void RegisterProtocol(std::string scheme, std::string displayName, ReactPromise<void> promise) noexcept {
    try {
      wchar_t exe[MAX_PATH]{};
      GetModuleFileNameW(nullptr, exe, MAX_PATH);
      ActivationRegistrationManager::RegisterForProtocolActivation(ToWide(scheme), L"", ToWide(displayName), exe);
      promise.Resolve();
    } catch (winrt::hresult_error const &error) {
      promise.Reject(Message(error).c_str());
    }
  }

 private:
  ReactContext m_context;
  AppInstance::Activated_revoker m_activated;
};

} // namespace ExpoWindows
