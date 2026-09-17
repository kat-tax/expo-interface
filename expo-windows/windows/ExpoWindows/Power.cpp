#include "pch.h"

#include "Common.h"

#include <NativeModules.h>

using namespace winrt;
using namespace winrt::Microsoft::ReactNative;
using namespace winrt::Windows::System::Power;

namespace {

/**
 * What `expo-battery` asks, from the system's power manager: whether there
 * is a battery, its charge as a fraction, whether it charges, and whether
 * the energy saver is on. A battery that is plugged in and neither charging
 * nor discharging is full at 100 %, and otherwise "not charging", Android's
 * word for the same.
 */
JSValueObject State() {
  const auto status = PowerManager::BatteryStatus();
  const bool hasBattery = status != BatteryStatus::NotPresent;
  const int percent = PowerManager::RemainingChargePercent();
  char const *state = "UNKNOWN";
  switch (status) {
    case BatteryStatus::Discharging: state = "UNPLUGGED"; break;
    case BatteryStatus::Charging: state = "CHARGING"; break;
    case BatteryStatus::Idle: state = percent >= 100 ? "FULL" : "NOT_CHARGING"; break;
    default: break;
  }
  return JSValueObject{
      {"hasBattery", hasBattery},
      {"level", hasBattery ? percent / 100.0 : -1.0},
      {"state", state},
      {"lowPowerMode", PowerManager::EnergySaverStatus() == EnergySaverStatus::On},
  };
}

JSValueObject NoBattery() {
  return JSValueObject{{"hasBattery", false}, {"level", -1.0}, {"state", "UNKNOWN"}, {"lowPowerMode", false}};
}

} // namespace

/**
 * `ExpoWindowsPower`: the machine's power for `expo-battery` — the state
 * on request and `onPowerChanged` from the power manager's events — and
 * the display kept awake for `expo-keep-awake`, through the thread
 * execution state of the UI thread, which lives as long as the app.
 */
REACT_MODULE(ExpoWindowsPower)
struct ExpoWindowsPower {
  REACT_INIT(Initialize)
  void Initialize(ReactContext const &context) noexcept {
    m_context = context;
    try {
      m_battery = PowerManager::BatteryStatusChanged(auto_revoke, [this](auto const &, auto const &) { Notify(); });
      m_charge = PowerManager::RemainingChargePercentChanged(auto_revoke, [this](auto const &, auto const &) { Notify(); });
      m_saver = PowerManager::EnergySaverStatusChanged(auto_revoke, [this](auto const &, auto const &) { Notify(); });
      m_supply = PowerManager::PowerSupplyStatusChanged(auto_revoke, [this](auto const &, auto const &) { Notify(); });
    } catch (...) {
      // No power manager: the state is read on request, without events.
    }
  }

  REACT_EVENT(OnPowerChanged, L"onPowerChanged")
  std::function<void(JSValue)> OnPowerChanged;

  REACT_SYNC_METHOD(GetState, L"getState")
  JSValue GetState() noexcept {
    try {
      return State();
    } catch (...) {
      return NoBattery();
    }
  }

  /** Keeps the display (and the system) awake, or lets them sleep again. */
  REACT_METHOD(SetKeepAwake, L"setKeepAwake")
  void SetKeepAwake(bool active) noexcept {
    m_context.UIDispatcher().Post([active] {
      SetThreadExecutionState(active ? ES_CONTINUOUS | ES_DISPLAY_REQUIRED | ES_SYSTEM_REQUIRED : ES_CONTINUOUS);
    });
  }

 private:
  void Notify() noexcept {
    try {
      OnPowerChanged(State());
    } catch (...) {
    }
  }

  ReactContext m_context;
  PowerManager::BatteryStatusChanged_revoker m_battery;
  PowerManager::RemainingChargePercentChanged_revoker m_charge;
  PowerManager::EnergySaverStatusChanged_revoker m_saver;
  PowerManager::PowerSupplyStatusChanged_revoker m_supply;
};
