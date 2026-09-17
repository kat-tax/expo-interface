#include "pch.h"

#include "Common.h"

#include <NativeModules.h>

using namespace winrt;
using namespace winrt::Microsoft::ReactNative;
using namespace winrt::Microsoft::Windows::AppNotifications;
using namespace winrt::Microsoft::Windows::AppNotifications::Builder;
using namespace winrt::Microsoft::Windows::BadgeNotifications;
using namespace ExpoWindows;

namespace {

char const *Name(AppNotificationSetting setting) noexcept {
  switch (setting) {
    case AppNotificationSetting::Enabled: return "Enabled";
    case AppNotificationSetting::DisabledForApplication: return "DisabledForApplication";
    case AppNotificationSetting::DisabledForUser: return "DisabledForUser";
    case AppNotificationSetting::DisabledByGroupPolicy: return "DisabledByGroupPolicy";
    case AppNotificationSetting::DisabledByManifest: return "DisabledByManifest";
    default: return "Unsupported";
  }
}

std::string Lookup(winrt::Windows::Foundation::Collections::IMap<hstring, hstring> const &map, wchar_t const *key) {
  if (!map || !map.HasKey(key)) return {};
  return ToUtf8(map.Lookup(key));
}

} // namespace

/**
 * `ExpoWindowsNotifications`: the app's notifications for
 * `expo-notifications`, through the Windows App SDK's app notification
 * manager, which an unpackaged app registers with at startup (the exe's
 * name and icon become the app's on the toast). A notification is shown
 * with its title and body, tagged by the package's identifier, and
 * dismissed by that tag; the ones in the notification center are listed
 * by tag; a click on one — while the app runs, or the launch it caused —
 * is `onNotificationResponse` with the identifier, the action and any
 * text typed. The badge on the taskbar is a count. Whether the user lets
 * the app notify is the manager's setting.
 */
REACT_MODULE(ExpoWindowsNotifications)
struct ExpoWindowsNotifications {
  REACT_INIT(Initialize)
  void Initialize(ReactContext const &context) noexcept {
    m_context = context;
    try {
      auto manager = AppNotificationManager::Default();
      m_invoked = manager.NotificationInvoked(auto_revoke, [this](auto const &, AppNotificationActivatedEventArgs const &args) { Respond(args); });
      manager.Register();
      m_registered = true;
      auto activation = winrt::Microsoft::Windows::AppLifecycle::AppInstance::GetCurrent().GetActivatedEventArgs();
      if (activation && activation.Kind() == winrt::Microsoft::Windows::AppLifecycle::ExtendedActivationKind::AppNotification) {
        Respond(activation.Data().as<AppNotificationActivatedEventArgs>());
      }
    } catch (...) {
      // No notification manager: the methods say so as they are called.
    }
  }

  ~ExpoWindowsNotifications() {
    if (!m_registered) return;
    try {
      AppNotificationManager::Default().Unregister();
    } catch (...) {
    }
  }

  REACT_EVENT(OnNotificationResponse, L"onNotificationResponse")
  std::function<void(JSValue)> OnNotificationResponse;

  /** Whether the user lets the app notify, by the manager's setting's name. */
  REACT_SYNC_METHOD(Setting, L"setting")
  std::string Setting() noexcept {
    try {
      return Name(AppNotificationManager::Default().Setting());
    } catch (...) {
      return "Unsupported";
    }
  }

  REACT_METHOD(Show, L"show")
  void Show(std::string id, std::string title, std::string body, bool silent, ReactPromise<void> promise) noexcept {
    try {
      AppNotificationBuilder builder;
      builder.AddArgument(L"id", to_hstring(id));
      if (!title.empty()) builder.AddText(to_hstring(title));
      if (!body.empty()) builder.AddText(to_hstring(body));
      builder.SetTag(to_hstring(id));
      if (silent) builder.MuteAudio();
      AppNotificationManager::Default().Show(builder.BuildNotification());
      promise.Resolve();
    } catch (hresult_error const &error) {
      promise.Reject(Message(error).c_str());
    }
  }

  REACT_METHOD(Remove, L"remove")
  void Remove(std::string tag, ReactPromise<void> promise) noexcept {
    try {
      AppNotificationManager::Default().RemoveByTagAsync(to_hstring(tag)).Completed([promise](auto const &operation, auto) {
        try {
          operation.GetResults();
          promise.Resolve();
        } catch (hresult_error const &error) {
          promise.Reject(Message(error).c_str());
        }
      });
    } catch (hresult_error const &error) {
      promise.Reject(Message(error).c_str());
    }
  }

  REACT_METHOD(RemoveAll, L"removeAll")
  void RemoveAll(ReactPromise<void> promise) noexcept {
    try {
      AppNotificationManager::Default().RemoveAllAsync().Completed([promise](auto const &operation, auto) {
        try {
          operation.GetResults();
          promise.Resolve();
        } catch (hresult_error const &error) {
          promise.Reject(Message(error).c_str());
        }
      });
    } catch (hresult_error const &error) {
      promise.Reject(Message(error).c_str());
    }
  }

  /** The tags of the app's notifications in the notification center. */
  REACT_METHOD(GetPresented, L"getPresented")
  void GetPresented(ReactPromise<JSValue> promise) noexcept {
    try {
      AppNotificationManager::Default().GetAllAsync().Completed([promise](auto const &operation, auto) {
        try {
          JSValueArray tags;
          for (auto const &notification : operation.GetResults()) tags.push_back(ToUtf8(notification.Tag()));
          promise.Resolve(std::move(tags));
        } catch (hresult_error const &error) {
          promise.Reject(Message(error).c_str());
        }
      });
    } catch (hresult_error const &error) {
      promise.Reject(Message(error).c_str());
    }
  }

  /** The badge on the taskbar as a count, or cleared at zero; resolves whether the system took it. */
  REACT_METHOD(SetBadge, L"setBadge")
  void SetBadge(int count, ReactPromise<bool> promise) noexcept {
    try {
      auto manager = BadgeNotificationManager::Current();
      if (count > 0) {
        manager.SetBadgeAsCount(static_cast<uint32_t>(count));
      } else {
        manager.ClearBadge();
      }
      promise.Resolve(true);
    } catch (...) {
      promise.Resolve(false);
    }
  }

 private:
  void Respond(AppNotificationActivatedEventArgs const &args) noexcept {
    try {
      auto arguments = args.Arguments();
      auto action = Lookup(arguments, L"action");
      auto response = JSValueObject{
          {"id", Lookup(arguments, L"id")},
          {"action", action.empty() ? std::string("default") : action},
          {"userText", Lookup(args.UserInput(), L"text")},
      };
      OnNotificationResponse(std::move(response));
    } catch (...) {
    }
  }

  ReactContext m_context;
  bool m_registered = false;
  AppNotificationManager::NotificationInvoked_revoker m_invoked;
};
