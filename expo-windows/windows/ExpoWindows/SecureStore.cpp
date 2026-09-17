#include "pch.h"

#include "Common.h"

#include <NativeModules.h>

using namespace winrt;
using namespace winrt::Microsoft::ReactNative;
using namespace winrt::Windows::Foundation;
using namespace winrt::Windows::Security::Credentials::UI;
using namespace ExpoWindows;

namespace fs = std::filesystem;

namespace {

/** A name safe as a file or folder name: letters, digits, `.`, `-` and `_`, anything else an underscore. */
std::wstring SafeName(std::string const &name) {
  std::wstring out;
  for (wchar_t c : ToWide(name)) out += (iswalnum(c) || c == L'.' || c == L'-' || c == L'_') ? c : L'_';
  return out.empty() ? L"default" : out;
}

/** `%LOCALAPPDATA%\<the exe's name>\SecureStore\<service>`: the app's own local data, one folder per keychain service. */
fs::path StoreDirectory(std::string const &service) {
  PWSTR local = nullptr;
  check_hresult(SHGetKnownFolderPath(FOLDERID_LocalAppData, 0, nullptr, &local));
  fs::path directory(local);
  CoTaskMemFree(local);
  wchar_t exe[MAX_PATH]{};
  GetModuleFileNameW(nullptr, exe, MAX_PATH);
  return directory / fs::path(exe).stem() / L"SecureStore" / SafeName(service);
}

fs::path ValueFile(std::string const &key, std::string const &service) {
  return StoreDirectory(service) / (SafeName(key) + L".dat");
}

DATA_BLOB Blob(std::string &bytes) {
  return DATA_BLOB{static_cast<DWORD>(bytes.size()), reinterpret_cast<BYTE *>(bytes.data())};
}

/** The value encrypted for the current user (DPAPI), bound to its key so a file renamed to another key does not open. */
std::string Protect(std::string value, std::string key) {
  DATA_BLOB in = Blob(value), entropy = Blob(key), out{};
  if (!CryptProtectData(&in, L"expo-secure-store", &entropy, nullptr, nullptr, CRYPTPROTECT_UI_FORBIDDEN, &out)) throw_last_error();
  std::string bytes(reinterpret_cast<char *>(out.pbData), out.cbData);
  LocalFree(out.pbData);
  return bytes;
}

std::string Unprotect(std::string bytes, std::string key) {
  DATA_BLOB in = Blob(bytes), entropy = Blob(key), out{};
  if (!CryptUnprotectData(&in, nullptr, &entropy, nullptr, nullptr, CRYPTPROTECT_UI_FORBIDDEN, &out)) throw_last_error();
  std::string value(reinterpret_cast<char *>(out.pbData), out.cbData);
  LocalFree(out.pbData);
  return value;
}

std::string ReadBytes(fs::path const &file) {
  std::ifstream stream(file, std::ios::binary);
  if (!stream) throw hresult_error(E_FAIL, L"The value could not be read");
  return std::string(std::istreambuf_iterator<char>(stream), {});
}

void WriteBytes(fs::path const &file, std::string const &bytes) {
  fs::create_directories(file.parent_path());
  std::ofstream stream(file, std::ios::binary | std::ios::trunc);
  stream.write(bytes.data(), static_cast<std::streamsize>(bytes.size()));
  if (!stream) throw hresult_error(E_FAIL, L"The value could not be written");
}

/** A synchronous method cannot reject: it answers with the value, or with the error. */
JSValueObject Value(JSValue value) {
  return JSValueObject{{"value", std::move(value)}};
}

JSValueObject Failure(std::string message) {
  return JSValueObject{{"error", std::move(message)}};
}

} // namespace

/**
 * `ExpoWindowsSecureStore`: what `expo-secure-store` keeps its values in.
 * Each value is encrypted for the current Windows user with DPAPI and kept
 * as a file of the app's local data, the keychain service as its folder.
 * `verify` asks Windows Hello (`UserConsentVerifier`, for the app's window)
 * for a value that requires the user's presence; whether Windows Hello is
 * set up is read once at the instance's start, since the synchronous
 * question cannot wait for the asynchronous answer.
 */
REACT_MODULE(ExpoWindowsSecureStore)
struct ExpoWindowsSecureStore {
  REACT_INIT(Initialize)
  void Initialize(ReactContext const &context) noexcept {
    m_context = context;
    try {
      UserConsentVerifier::CheckAvailabilityAsync().Completed([this](auto const &operation, auto) {
        try {
          m_canVerify = operation.GetResults() == UserConsentVerifierAvailability::Available;
        } catch (...) {
        }
      });
    } catch (...) {
      // No verifier at all: Windows Hello is not there.
    }
  }

  REACT_SYNC_METHOD(GetValue, L"getValue")
  JSValue GetValue(std::string key, std::string service) noexcept {
    try {
      auto file = ValueFile(key, service);
      if (!fs::exists(file)) return Value(nullptr);
      return Value(Unprotect(ReadBytes(file), key));
    } catch (hresult_error const &error) {
      return Failure(Message(error));
    } catch (std::exception const &error) {
      return Failure(error.what());
    }
  }

  REACT_SYNC_METHOD(SetValue, L"setValue")
  JSValue SetValue(std::string value, std::string key, std::string service) noexcept {
    try {
      WriteBytes(ValueFile(key, service), Protect(std::move(value), key));
      return Value(nullptr);
    } catch (hresult_error const &error) {
      return Failure(Message(error));
    } catch (std::exception const &error) {
      return Failure(error.what());
    }
  }

  REACT_SYNC_METHOD(DeleteValue, L"deleteValue")
  JSValue DeleteValue(std::string key, std::string service) noexcept {
    try {
      fs::remove(ValueFile(key, service));
      return Value(nullptr);
    } catch (hresult_error const &error) {
      return Failure(Message(error));
    } catch (std::exception const &error) {
      return Failure(error.what());
    }
  }

  REACT_METHOD(Verify, L"verify")
  void Verify(std::string prompt, ReactPromise<bool> promise) noexcept {
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
            promise.Resolve(sender.GetResults() == UserConsentVerificationResult::Verified);
          } catch (hresult_error const &error) {
            promise.Reject(Message(error).c_str());
          }
        });
      } catch (hresult_error const &error) {
        promise.Reject(Message(error).c_str());
      }
    });
  }

  REACT_SYNC_METHOD(CanVerify, L"canVerify")
  bool CanVerify() noexcept {
    return m_canVerify;
  }

 private:
  ReactContext m_context;
  std::atomic<bool> m_canVerify{false};
};
