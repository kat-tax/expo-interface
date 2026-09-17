#include "pch.h"

#include "Common.h"

#include <NativeModules.h>

using namespace winrt;
using namespace winrt::Microsoft::ReactNative;
using namespace winrt::Windows::Foundation;
using namespace winrt::Windows::Security::Credentials::UI;
using namespace ExpoWindows;

namespace {

char const *Name(UserConsentVerifierAvailability availability) noexcept {
  switch (availability) {
    case UserConsentVerifierAvailability::Available: return "Available";
    case UserConsentVerifierAvailability::NotConfiguredForUser: return "NotConfiguredForUser";
    case UserConsentVerifierAvailability::DisabledByPolicy: return "DisabledByPolicy";
    case UserConsentVerifierAvailability::DeviceBusy: return "DeviceBusy";
    default: return "DeviceNotPresent";
  }
}

char const *Name(UserConsentVerificationResult result) noexcept {
  switch (result) {
    case UserConsentVerificationResult::Verified: return "Verified";
    case UserConsentVerificationResult::DeviceNotPresent: return "DeviceNotPresent";
    case UserConsentVerificationResult::NotConfiguredForUser: return "NotConfiguredForUser";
    case UserConsentVerificationResult::DisabledByPolicy: return "DisabledByPolicy";
    case UserConsentVerificationResult::DeviceBusy: return "DeviceBusy";
    case UserConsentVerificationResult::RetriesExhausted: return "RetriesExhausted";
    default: return "Canceled";
  }
}

} // namespace

/**
 * `ExpoWindowsLocalAuthentication`: Windows Hello for
 * `expo-local-authentication` — whether it is there and set up
 * (`UserConsentVerifier`'s availability, by name), and a verification for
 * the app's window with the prompt the app gives, answered by the name of
 * the result. Windows Hello does not say whether a face, a fingerprint or
 * a PIN answered.
 */
REACT_MODULE(ExpoWindowsLocalAuthentication)
struct ExpoWindowsLocalAuthentication {
  REACT_INIT(Initialize)
  void Initialize(ReactContext const &context) noexcept {
    m_context = context;
  }

  REACT_METHOD(CheckAvailability, L"checkAvailability")
  void CheckAvailability(ReactPromise<std::string> promise) noexcept {
    try {
      UserConsentVerifier::CheckAvailabilityAsync().Completed([promise](auto const &operation, auto) {
        try {
          promise.Resolve(Name(operation.GetResults()));
        } catch (hresult_error const &error) {
          promise.Reject(Message(error).c_str());
        }
      });
    } catch (hresult_error const &error) {
      promise.Reject(Message(error).c_str());
    }
  }

  REACT_METHOD(Verify, L"verify")
  void Verify(std::string prompt, ReactPromise<std::string> promise) noexcept {
    m_context.UIDispatcher().Post([prompt, promise] {
      try {
        HWND window = MainWindow();
        if (!window) throw hresult_error(E_FAIL, L"The app has no window yet");
        auto interop = get_activation_factory<UserConsentVerifier, IUserConsentVerifierInterop>();
        hstring message = to_hstring(prompt);
        IAsyncOperation<UserConsentVerificationResult> operation{nullptr};
        check_hresult(interop->RequestVerificationForWindowAsync(
            window, static_cast<HSTRING>(get_abi(message)), guid_of<IAsyncOperation<UserConsentVerificationResult>>(), put_abi(operation)));
        operation.Completed([promise](auto const &sender, auto) {
          try {
            promise.Resolve(Name(sender.GetResults()));
          } catch (hresult_error const &error) {
            promise.Reject(Message(error).c_str());
          }
        });
      } catch (hresult_error const &error) {
        promise.Reject(Message(error).c_str());
      }
    });
  }

 private:
  ReactContext m_context;
};
