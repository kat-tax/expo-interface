#include "pch.h"

#include "Common.h"

#include <NativeModules.h>

using namespace winrt;
using namespace winrt::Microsoft::ReactNative;
using namespace winrt::Windows::Networking;
using namespace winrt::Windows::Networking::Connectivity;
using namespace ExpoWindows;

namespace {

/** The state `expo-network` reports, from the profile the system routes the internet through. */
JSValueObject State() {
  auto profile = NetworkInformation::GetInternetConnectionProfile();
  if (!profile) return JSValueObject{{"type", "NONE"}, {"isConnected", false}, {"isInternetReachable", false}};
  auto level = profile.GetNetworkConnectivityLevel();
  char const *type = "OTHER";
  if (profile.IsWlanConnectionProfile()) {
    type = "WIFI";
  } else if (profile.IsWwanConnectionProfile()) {
    type = "CELLULAR";
  } else if (auto adapter = profile.NetworkAdapter()) {
    switch (adapter.IanaInterfaceType()) {
      case 6: type = "ETHERNET"; break;
      case 71: type = "WIFI"; break;
      case 53: case 131: type = "VPN"; break;
      case 243: case 244: type = "CELLULAR"; break;
      default: break;
    }
  }
  return JSValueObject{
      {"type", type},
      {"isConnected", level != NetworkConnectivityLevel::None},
      {"isInternetReachable", level == NetworkConnectivityLevel::InternetAccess},
  };
}

/** The IPv4 address of the internet profile's adapter; failing that, the first there is. */
std::string IpAddress() {
  std::wstring adapterId;
  if (auto profile = NetworkInformation::GetInternetConnectionProfile()) {
    if (auto adapter = profile.NetworkAdapter()) adapterId = to_hstring(adapter.NetworkAdapterId());
  }
  std::wstring first;
  for (auto const &host : NetworkInformation::GetHostNames()) {
    if (host.Type() != HostNameType::Ipv4) continue;
    auto info = host.IPInformation();
    std::wstring id = info && info.NetworkAdapter() ? std::wstring(to_hstring(info.NetworkAdapter().NetworkAdapterId())) : std::wstring{};
    if (!adapterId.empty() && id == adapterId) return ToUtf8(host.CanonicalName());
    if (first.empty()) first = host.CanonicalName();
  }
  return first.empty() ? "0.0.0.0" : ToUtf8(first);
}

} // namespace

/**
 * `ExpoWindowsNetwork`: what `expo-network` asks — the internet connection
 * profile's kind, connectivity and reachability, the address of its
 * adapter, and `onNetworkStateChanged` from the system's status event.
 */
REACT_MODULE(ExpoWindowsNetwork)
struct ExpoWindowsNetwork {
  REACT_INIT(Initialize)
  void Initialize(ReactContext const &) noexcept {
    try {
      m_changed = NetworkInformation::NetworkStatusChanged(auto_revoke, [this](auto const &) {
        try {
          OnNetworkStateChanged(State());
        } catch (...) {
        }
      });
    } catch (...) {
    }
  }

  REACT_EVENT(OnNetworkStateChanged, L"onNetworkStateChanged")
  std::function<void(JSValue)> OnNetworkStateChanged;

  REACT_METHOD(GetState, L"getState")
  void GetState(ReactPromise<JSValue> promise) noexcept {
    try {
      promise.Resolve(State());
    } catch (hresult_error const &error) {
      promise.Reject(Message(error).c_str());
    }
  }

  REACT_METHOD(GetIpAddress, L"getIpAddress")
  void GetIpAddress(ReactPromise<std::string> promise) noexcept {
    try {
      promise.Resolve(IpAddress());
    } catch (hresult_error const &error) {
      promise.Reject(Message(error).c_str());
    }
  }

 private:
  NetworkInformation::NetworkStatusChanged_revoker m_changed;
};
