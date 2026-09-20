#include "pch.h"

#include "ReactPackageProvider.h"
#if __has_include("ReactPackageProvider.g.cpp")
#include "ReactPackageProvider.g.cpp"
#endif

#include <NativeModules.h>

#include "Controls.h"
#include "Inputs.h"
#include "AutoSuggest.h"
#include "Overlays.h"

using namespace winrt::Microsoft::ReactNative;

namespace winrt::ExpoInterface::implementation
{

/**
 * Registers the kit's XAML-hosted controls with React Native. There are no
 * native modules: everything the kit needs from Windows is a view.
 */
void ReactPackageProvider::CreatePackage(IReactPackageBuilder const &packageBuilder) noexcept
{
  AddAttributedModules(packageBuilder, true);
#ifdef RNW_NEW_ARCH
  RegisterControls(packageBuilder);
  RegisterInputs(packageBuilder);
  RegisterOverlays(packageBuilder);
  RegisterAutoSuggest(packageBuilder);
#endif
}

} // namespace winrt::ExpoInterface::implementation
