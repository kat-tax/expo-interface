#include "pch.h"

#include "Common.h"

#include <NativeModules.h>

#include <map>
#include <mutex>

using namespace winrt;
using namespace winrt::Microsoft::ReactNative;
using namespace winrt::Windows::Devices::Geolocation;
using namespace winrt::Windows::Devices::Sensors;
using namespace winrt::Windows::Foundation;
using namespace ExpoWindows;

namespace {

/** Milliseconds since 1970 of a WinRT `DateTime` (100-nanosecond intervals since 1601). */
double Milliseconds(DateTime const &time) noexcept {
  return static_cast<double>(time.time_since_epoch().count() - 116444736000000000LL) / 10000.0;
}

JSValue Optional(IReference<double> const &value) {
  return value ? JSValue(value.Value()) : JSValue(nullptr);
}

/** The package's `LocationObject`, from a position. */
JSValueObject Location(Geoposition const &position) {
  auto coordinate = position.Coordinate();
  auto point = coordinate.Point().Position();
  return JSValueObject{
      {"coords",
       JSValueObject{
           {"latitude", point.Latitude},
           {"longitude", point.Longitude},
           {"altitude", point.Altitude},
           {"accuracy", coordinate.Accuracy()},
           {"altitudeAccuracy", Optional(coordinate.AltitudeAccuracy())},
           {"heading", Optional(coordinate.Heading())},
           {"speed", Optional(coordinate.Speed())},
       }},
      {"timestamp", Milliseconds(coordinate.Timestamp())},
      {"mocked", false},
  };
}

char const *Name(GeolocationAccessStatus status) noexcept {
  switch (status) {
    case GeolocationAccessStatus::Allowed: return "Allowed";
    case GeolocationAccessStatus::Denied: return "Denied";
    default: return "Unspecified";
  }
}

char const *Name(PositionStatus status) noexcept {
  switch (status) {
    case PositionStatus::Disabled: return "Location is turned off";
    case PositionStatus::NotAvailable: return "Location is not available on this machine";
    case PositionStatus::NoData: return "No location data";
    default: return nullptr;
  }
}

/** The package's heading accuracy (0 unknown, 2 medium, 3 high) from the compass's. */
int Accuracy(MagnetometerAccuracy accuracy) noexcept {
  switch (accuracy) {
    case MagnetometerAccuracy::Approximate: return 2;
    case MagnetometerAccuracy::High: return 3;
    default: return 0;
  }
}

} // namespace

/**
 * `ExpoWindowsLocation`: what `expo-location` asks, over the system's
 * geolocator — access as the system grants it, a position at the accuracy
 * asked, watches by id that report `onLocationChanged` as the position
 * moves (and `onLocationError` when the service goes away), and headings
 * from the compass, where there is one. Geocoding is no service Windows
 * has.
 */
REACT_MODULE(ExpoWindowsLocation)
struct ExpoWindowsLocation {
  REACT_INIT(Initialize)
  void Initialize(ReactContext const &context) noexcept {
    m_context = context;
  }

  REACT_EVENT(OnLocationChanged, L"onLocationChanged")
  std::function<void(JSValue)> OnLocationChanged;

  REACT_EVENT(OnLocationError, L"onLocationError")
  std::function<void(JSValue)> OnLocationError;

  REACT_EVENT(OnHeadingChanged, L"onHeadingChanged")
  std::function<void(JSValue)> OnHeadingChanged;

  /** The system's answer to the app's use of location: Allowed, Denied or Unspecified. */
  REACT_METHOD(RequestAccess, L"requestAccess")
  void RequestAccess(ReactPromise<std::string> promise) noexcept {
    m_context.UIDispatcher().Post([promise] {
      try {
        Geolocator::RequestAccessAsync().Completed([promise](auto const &operation, auto) {
          try {
            promise.Resolve(Name(operation.GetResults()));
          } catch (hresult_error const &error) {
            promise.Reject(Message(error).c_str());
          }
        });
      } catch (hresult_error const &error) {
        promise.Reject(Message(error).c_str());
      }
    });
  }

  /** One position, at the accuracy asked in meters, no older than `maximumAgeMs`, within `timeoutMs`. */
  REACT_METHOD(GetPosition, L"getPosition")
  void GetPosition(double accuracyMeters, double maximumAgeMs, double timeoutMs, ReactPromise<JSValue> promise) noexcept {
    try {
      Geolocator locator;
      locator.DesiredAccuracyInMeters(static_cast<uint32_t>(std::max(accuracyMeters, 1.0)));
      auto age = std::chrono::milliseconds(static_cast<int64_t>(std::max(maximumAgeMs, 0.0)));
      auto timeout = std::chrono::milliseconds(static_cast<int64_t>(std::max(timeoutMs, 1000.0)));
      locator.GetGeopositionAsync(age, timeout).Completed([promise, locator](auto const &operation, auto) {
        try {
          promise.Resolve(Location(operation.GetResults()));
        } catch (hresult_error const &error) {
          promise.Reject(Message(error).c_str());
        }
      });
    } catch (hresult_error const &error) {
      promise.Reject(Message(error).c_str());
    }
  }

  /** A watch by id: positions at least `intervalMs` apart, when moved `distanceMeters`, at the accuracy asked. */
  REACT_METHOD(Watch, L"watch")
  void Watch(int id, double intervalMs, double distanceMeters, double accuracyMeters) noexcept {
    try {
      Geolocator locator;
      locator.DesiredAccuracyInMeters(static_cast<uint32_t>(std::max(accuracyMeters, 1.0)));
      locator.ReportInterval(static_cast<uint32_t>(std::max(intervalMs, 0.0)));
      locator.MovementThreshold(std::max(distanceMeters, 0.0));
      Watched watched{locator};
      watched.position = locator.PositionChanged(auto_revoke, [this, id](auto const &, PositionChangedEventArgs const &args) {
        try {
          OnLocationChanged(JSValueObject{{"watchId", id}, {"location", Location(args.Position())}});
        } catch (...) {
        }
      });
      watched.status = locator.StatusChanged(auto_revoke, [this, id](auto const &, StatusChangedEventArgs const &args) {
        if (auto reason = Name(args.Status())) {
          try {
            OnLocationError(JSValueObject{{"watchId", id}, {"reason", reason}});
          } catch (...) {
          }
        }
      });
      std::lock_guard lock(m_mutex);
      m_watches[id] = std::move(watched);
    } catch (...) {
      // The watch reports nothing: the service is not there.
    }
  }

  /** Headings by id from the compass; rejects where the machine has none. */
  REACT_METHOD(WatchHeading, L"watchHeading")
  void WatchHeading(int id, ReactPromise<void> promise) noexcept {
    try {
      auto compass = Compass::GetDefault();
      if (!compass) {
        promise.Reject("This machine has no compass");
        return;
      }
      compass.ReportInterval(std::max(compass.MinimumReportInterval(), 100u));
      Heading heading{compass};
      heading.reading = compass.ReadingChanged(auto_revoke, [this, id](auto const &, CompassReadingChangedEventArgs const &args) {
        try {
          auto reading = args.Reading();
          OnHeadingChanged(JSValueObject{
              {"watchId", id},
              {"heading",
               JSValueObject{
                   {"trueHeading", Optional(reading.HeadingTrueNorth())},
                   {"magHeading", reading.HeadingMagneticNorth()},
                   {"accuracy", Accuracy(reading.HeadingAccuracy())},
               }},
          });
        } catch (...) {
        }
      });
      std::lock_guard lock(m_mutex);
      m_headings[id] = std::move(heading);
      promise.Resolve();
    } catch (hresult_error const &error) {
      promise.Reject(Message(error).c_str());
    }
  }

  REACT_METHOD(StopWatch, L"stopWatch")
  void StopWatch(int id) noexcept {
    std::lock_guard lock(m_mutex);
    m_watches.erase(id);
    m_headings.erase(id);
  }

 private:
  struct Watched {
    Geolocator locator{nullptr};
    Geolocator::PositionChanged_revoker position;
    Geolocator::StatusChanged_revoker status;
  };
  struct Heading {
    Compass compass{nullptr};
    Compass::ReadingChanged_revoker reading;
  };

  ReactContext m_context;
  std::mutex m_mutex;
  std::map<int, Watched> m_watches;
  std::map<int, Heading> m_headings;
};
