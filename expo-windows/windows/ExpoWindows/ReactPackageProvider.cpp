#include "pch.h"

#include "ReactPackageProvider.h"
#if __has_include("ReactPackageProvider.g.cpp")
#include "ReactPackageProvider.g.cpp"
#endif

#include <NativeModules.h>

#include "Common.h"
#include "Islands.h"

using namespace winrt::Microsoft::ReactNative;

namespace {

/**
 * The database path `@react-native-async-storage/async-storage`'s Windows
 * module reads from the core application's properties before it falls back
 * to `ApplicationData.Current`, which an unpackaged app has not (the module
 * then fails every call with "The process has no package identity"): a
 * file in the app's own folder of the user's local data, beside the
 * runtime's files. Set once, at the package's creation, before any module
 * runs; an app that set the property itself keeps its own.
 */
void PointAsyncStorageAtLocalData() noexcept {
  try {
    auto properties = winrt::Windows::ApplicationModel::Core::CoreApplication::Properties();
    constexpr auto key = L"React-Native-Community-Async-Storage-Database-Path";
    if (properties.HasKey(key)) return;
    auto path = ExpoWindows::AppDataFolder() / L"AsyncStorage.db";
    std::filesystem::create_directories(path.parent_path());
    properties.Insert(key, winrt::box_value(winrt::hstring(path.wstring())));
  } catch (...) {
    // Without the property the module reads ApplicationData.Current, and says why it cannot.
  }
}

} // namespace

namespace winrt::ExpoWindows::implementation
{

/**
 * Registers the runtime's modules with React Native: every `REACT_MODULE`
 * in this library — the window, the device, the clipboard, sharing,
 * linking, fonts, crypto, the secure store, localization, the network —
 * as a TurboModule, under the name the runtime's JavaScript asks
 * `TurboModuleRegistry` for; and its islands, the web view and the video
 * view. And points async-storage's module at the app's local data first.
 */
void ReactPackageProvider::CreatePackage(IReactPackageBuilder const &packageBuilder) noexcept
{
  PointAsyncStorageAtLocalData();
  AddAttributedModules(packageBuilder, true);
#ifdef RNW_NEW_ARCH
  RegisterWebView(packageBuilder);
  RegisterVideoView(packageBuilder);
  RegisterMapView(packageBuilder);
  RegisterCameraView(packageBuilder);
#endif
}

} // namespace winrt::ExpoWindows::implementation
