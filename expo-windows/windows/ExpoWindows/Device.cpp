#include "pch.h"

#include <NativeModules.h>

#include "Common.h"

using namespace winrt::Microsoft::ReactNative;

namespace ExpoWindows {

/**
 * `ExpoWindowsDevice`: what `expo-device` reports on Windows, as constants
 * — the machine's name, maker and model from `EasClientDeviceInformation`,
 * the OS version from `AnalyticsInfo`, the memory and the processor from
 * Win32 — and the uptime on request.
 */
REACT_MODULE(ExpoWindowsDevice)
struct ExpoWindowsDevice {
  REACT_CONSTANT_PROVIDER(Constants)
  void Constants(ReactConstantProvider &provider) noexcept {
    try {
      winrt::Windows::Security::ExchangeActiveSyncProvisioning::EasClientDeviceInformation info;
      provider.Add(L"deviceName", ToUtf8(info.FriendlyName()));
      provider.Add(L"manufacturer", ToUtf8(info.SystemManufacturer()));
      provider.Add(L"brand", ToUtf8(info.SystemManufacturer()));
      provider.Add(L"modelName", ToUtf8(info.SystemProductName()));
      provider.Add(L"productName", ToUtf8(info.SystemProductName()));
      provider.Add(L"modelId", ToUtf8(info.SystemSku()));
      provider.Add(L"designName", ToUtf8(info.SystemHardwareVersion()));
    } catch (...) {
      // Not every edition answers; the fields stay absent, and null in JavaScript.
    }
    try {
      const auto family = winrt::Windows::System::Profile::AnalyticsInfo::VersionInfo().DeviceFamilyVersion();
      const uint64_t version = std::stoull(ToUtf8(family));
      const auto major = (version >> 48) & 0xFFFF;
      const auto minor = (version >> 32) & 0xFFFF;
      const auto build = (version >> 16) & 0xFFFF;
      const auto revision = version & 0xFFFF;
      provider.Add(L"osVersion", std::to_string(major) + "." + std::to_string(minor) + "." + std::to_string(build));
      provider.Add(L"osBuildId", std::to_string(build) + "." + std::to_string(revision));
    } catch (...) {
    }
    MEMORYSTATUSEX memory{};
    memory.dwLength = sizeof(memory);
    if (GlobalMemoryStatusEx(&memory)) {
      provider.Add(L"totalMemory", static_cast<double>(memory.ullTotalPhys));
    }
    SYSTEM_INFO system{};
    GetNativeSystemInfo(&system);
    const char *architecture = system.wProcessorArchitecture == PROCESSOR_ARCHITECTURE_ARM64 ? "arm64"
                               : system.wProcessorArchitecture == PROCESSOR_ARCHITECTURE_AMD64 ? "x64"
                               : system.wProcessorArchitecture == PROCESSOR_ARCHITECTURE_INTEL ? "x86"
                                                                                                : "unknown";
    provider.Add(L"supportedCpuArchitectures", std::vector<std::string>{architecture});
  }

  REACT_METHOD(GetUptime, L"getUptime")
  void GetUptime(ReactPromise<double> promise) noexcept {
    promise.Resolve(static_cast<double>(GetTickCount64()));
  }
};

} // namespace ExpoWindows
