#include "pch.h"

#include <NativeModules.h>

#include "Common.h"

using namespace winrt::Microsoft::ReactNative;
using namespace winrt::Windows::ApplicationModel::DataTransfer;
using namespace winrt::Windows::Foundation::Collections;
using namespace winrt::Windows::Storage;

namespace ExpoWindows {

namespace {

/** Opens the share sheet for a file, over the app's window, on the UI thread. */
winrt::fire_and_forget ShareAsync(std::wstring path, std::wstring title, ReactPromise<void> promise) noexcept {
  try {
    const auto window = MainWindow();
    if (!window) {
      promise.Reject("There is no window to share from yet.");
      co_return;
    }
    auto file = co_await StorageFile::GetFileFromPathAsync(path);
    // The share sheet of a Win32 window: the manager for the window, through the interop factory.
    auto interop = winrt::get_activation_factory<DataTransferManager, IDataTransferManagerInterop>();
    DataTransferManager manager{nullptr};
    winrt::check_hresult(interop->GetForWindow(window, winrt::guid_of<DataTransferManager>(), winrt::put_abi(manager)));
    auto token = std::make_shared<winrt::event_token>();
    *token = manager.DataRequested([file, title, manager, token](DataTransferManager const &, DataRequestedEventArgs const &args) {
      // One request per share: the handler leaves once it has answered.
      manager.DataRequested(*token);
      auto data = args.Request().Data();
      data.Properties().Title(title.empty() ? file.Name() : winrt::hstring{title});
      data.SetStorageItems(winrt::single_threaded_vector<IStorageItem>({file}));
    });
    winrt::check_hresult(interop->ShowShareUIForWindow(window));
    promise.Resolve();
  } catch (winrt::hresult_error const &error) {
    promise.Reject(Message(error).c_str());
  }
}

} // namespace

/**
 * `ExpoWindowsSharing`: what `expo-sharing` shares through on Windows — the
 * share sheet (`DataTransferManager`) with the file, over the app's window.
 */
REACT_MODULE(ExpoWindowsSharing)
struct ExpoWindowsSharing {
  REACT_INIT(Initialize)
  void Initialize(ReactContext const &context) noexcept {
    m_context = context;
  }

  REACT_METHOD(IsAvailable, L"isAvailable")
  void IsAvailable(ReactPromise<bool> promise) noexcept {
    m_context.UIDispatcher().Post([promise] { promise.Resolve(MainWindow() != nullptr); });
  }

  REACT_METHOD(Share, L"share")
  void Share(std::string path, std::string title, ReactPromise<void> promise) noexcept {
    m_context.UIDispatcher().Post([path = ToWide(path), title = ToWide(title), promise] { ShareAsync(path, title, promise); });
  }

 private:
  ReactContext m_context;
};

} // namespace ExpoWindows
