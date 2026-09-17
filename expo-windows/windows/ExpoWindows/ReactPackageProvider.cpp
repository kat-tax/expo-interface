#include "pch.h"

#include "ReactPackageProvider.h"
#if __has_include("ReactPackageProvider.g.cpp")
#include "ReactPackageProvider.g.cpp"
#endif

#include <NativeModules.h>

using namespace winrt::Microsoft::ReactNative;

namespace winrt::ExpoWindows::implementation
{

/**
 * Registers the runtime's modules with React Native: every `REACT_MODULE`
 * in this library — the window, the device, the clipboard, sharing,
 * linking and fonts — as a TurboModule, under the name the runtime's
 * JavaScript asks `TurboModuleRegistry` for.
 */
void ReactPackageProvider::CreatePackage(IReactPackageBuilder const &packageBuilder) noexcept
{
  AddAttributedModules(packageBuilder, true);
}

} // namespace winrt::ExpoWindows::implementation
