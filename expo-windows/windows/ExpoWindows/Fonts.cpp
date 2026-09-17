#include "pch.h"

#include <NativeModules.h>

#include "Common.h"

using namespace winrt::Microsoft::ReactNative;
using namespace winrt::Windows::Foundation;
using namespace winrt::Windows::Storage;

namespace ExpoWindows {

namespace {

std::mutex g_mutex;
/** The font file registered for each family, for unloading. */
std::map<std::wstring, std::wstring> g_loaded;

/** `%LOCALAPPDATA%\expo-windows\fonts`, created on first use: where a font served over HTTP is kept. */
std::wstring FontsDirectory() {
  wchar_t *local = nullptr;
  winrt::check_hresult(SHGetKnownFolderPath(FOLDERID_LocalAppData, 0, nullptr, &local));
  std::wstring directory{local};
  CoTaskMemFree(local);
  directory += L"\\expo-windows";
  CreateDirectoryW(directory.c_str(), nullptr);
  directory += L"\\fonts";
  CreateDirectoryW(directory.c_str(), nullptr);
  return directory;
}

std::wstring FileName(std::wstring const &family, std::wstring const &uri) {
  std::wstring name;
  for (auto c : family) name += (std::iswalnum(c) || c == L'-' || c == L'_') ? c : L'_';
  const auto extension = uri.rfind(L".otf") != std::wstring::npos ? L".otf" : L".ttf";
  return name + extension;
}

/** Registers the file with GDI and DirectWrite for this process, under the family name the file carries. */
void Register(std::wstring const &family, std::wstring const &path, ReactPromise<void> const &promise) noexcept {
  // Private to the process, removed with it. react-native-windows 0.84's text does not
  // draw a font registered after launch, private or public (its DirectWrite fonts are
  // resolved once); the registration is right for the day it does, and for GDI now.
  if (AddFontResourceExW(path.c_str(), FR_PRIVATE, nullptr) == 0) {
    promise.Reject("The font file could not be loaded.");
    return;
  }
  SendNotifyMessageW(HWND_BROADCAST, WM_FONTCHANGE, 0, 0);
  // react-native-windows draws text with DirectWrite's shared factory, whose system
  // font collection is cached: asked to check for updates, it takes the new font in.
  winrt::com_ptr<IDWriteFactory> factory;
  if (SUCCEEDED(DWriteCreateFactory(DWRITE_FACTORY_TYPE_SHARED, __uuidof(IDWriteFactory), reinterpret_cast<::IUnknown **>(factory.put())))) {
    winrt::com_ptr<IDWriteFontCollection> collection;
    factory->GetSystemFontCollection(collection.put(), TRUE);
  }
  {
    std::scoped_lock lock{g_mutex};
    g_loaded[family] = path;
  }
  promise.Resolve();
}

winrt::fire_and_forget LoadAsync(std::wstring family, std::string uri, ReactPromise<void> promise) noexcept {
  try {
    auto path = PathFromUri(uri);
    if (path.empty()) {
      // Served by Metro or a web host: fetched to the local data folder first.
      co_await winrt::resume_background();
      winrt::Windows::Web::Http::HttpClient client;
      auto bytes = co_await client.GetBufferAsync(Uri{ToWide(uri)});
      auto folder = co_await StorageFolder::GetFolderFromPathAsync(FontsDirectory());
      auto file = co_await folder.CreateFileAsync(FileName(family, ToWide(uri)), CreationCollisionOption::ReplaceExisting);
      co_await FileIO::WriteBufferAsync(file, bytes);
      path = std::wstring{file.Path()};
    }
    Register(family, path, promise);
  } catch (winrt::hresult_error const &error) {
    promise.Reject(Message(error).c_str());
  }
}

} // namespace

/**
 * `ExpoWindowsFonts`: what `expo-font` loads through on Windows. A font file
 * — local, or fetched when served over HTTP — is registered with the
 * process (`AddFontResourceEx`), which is how react-native-windows' text
 * finds it: by the family name inside the file, so the name an app loads a
 * font under must be that name.
 */
REACT_MODULE(ExpoWindowsFonts)
struct ExpoWindowsFonts {
  REACT_METHOD(Load, L"load")
  void Load(std::string family, std::string uri, ReactPromise<void> promise) noexcept {
    LoadAsync(ToWide(family), uri, promise);
  }

  REACT_METHOD(Unload, L"unload")
  void Unload(std::string family, ReactPromise<void> promise) noexcept {
    std::wstring path;
    {
      std::scoped_lock lock{g_mutex};
      auto found = g_loaded.find(ToWide(family));
      if (found != g_loaded.end()) {
        path = found->second;
        g_loaded.erase(found);
      }
    }
    if (!path.empty()) {
      RemoveFontResourceExW(path.c_str(), FR_PRIVATE, nullptr);
      SendNotifyMessageW(HWND_BROADCAST, WM_FONTCHANGE, 0, 0);
    }
    promise.Resolve();
  }
};

} // namespace ExpoWindows
