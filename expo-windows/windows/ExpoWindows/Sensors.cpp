#include "pch.h"

#include "Common.h"

#include <NativeModules.h>

#include <cmath>
#include <map>
#include <memory>
#include <mutex>

using namespace winrt;
using namespace winrt::Microsoft::ReactNative;
using namespace winrt::Windows::Devices::Sensors;
using namespace winrt::Windows::Foundation;
using namespace ExpoWindows;

namespace {

constexpr double kPi = 3.14159265358979323846;
constexpr double kGravity = 9.80665;

/** Seconds since 1970 of a WinRT `DateTime`, the timestamp the packages carry. */
double Seconds(DateTime const &time) noexcept {
  return static_cast<double>(time.time_since_epoch().count() - 116444736000000000LL) / 10000000.0;
}

double Radians(double degrees) noexcept {
  return degrees * kPi / 180.0;
}

/** The interval a sensor is asked for: what the package set, no faster than the sensor can. */
uint32_t Interval(uint32_t minimum, double intervalMs) noexcept {
  return std::max(minimum, static_cast<uint32_t>(std::max(intervalMs, 0.0)));
}

} // namespace

/**
 * `ExpoWindowsSensors`: the machine's sensors for `expo-sensors`, each by
 * kind — the accelerometer (in g), the gyrometer (in rad/s, as the package
 * reports), the magnetometer (in µT), the barometer (in hPa), the light
 * sensor (in lux), the pedometer (steps), and device motion assembled from
 * the accelerometer, the linear accelerometer, the gyrometer and the
 * inclinometer — started and stopped by kind, their readings sent as
 * `onSensorReading` at the interval asked. `GetDefault()` answers null on
 * most desktops, and `available` says so.
 */
REACT_MODULE(ExpoWindowsSensors)
struct ExpoWindowsSensors {
  REACT_INIT(Initialize)
  void Initialize(ReactContext const &context) noexcept {
    m_context = context;
    try {
      Pedometer::GetDefaultAsync().Completed([this](auto const &operation, auto) {
        try {
          std::lock_guard lock(m_mutex);
          m_pedometer = operation.GetResults();
        } catch (...) {
        }
      });
    } catch (...) {
    }
  }

  REACT_EVENT(OnSensorReading, L"onSensorReading")
  std::function<void(JSValue)> OnSensorReading;

  REACT_SYNC_METHOD(Available, L"available")
  bool Available(std::string kind) noexcept {
    try {
      if (kind == "accelerometer" || kind == "deviceMotion") return Accelerometer::GetDefault() != nullptr;
      if (kind == "gyroscope") return Gyrometer::GetDefault() != nullptr;
      if (kind == "magnetometer" || kind == "magnetometerUncalibrated") return Magnetometer::GetDefault() != nullptr;
      if (kind == "barometer") return Barometer::GetDefault() != nullptr;
      if (kind == "light") return LightSensor::GetDefault() != nullptr;
      if (kind == "pedometer") {
        std::lock_guard lock(m_mutex);
        return m_pedometer != nullptr;
      }
    } catch (...) {
    }
    return false;
  }

  REACT_METHOD(Start, L"start")
  void Start(std::string kind, double intervalMs) noexcept {
    try {
      Started started;
      if (kind == "accelerometer") {
        auto sensor = Accelerometer::GetDefault();
        if (!sensor) return;
        sensor.ReportInterval(Interval(sensor.MinimumReportInterval(), intervalMs));
        started.revoker = Keep(sensor.ReadingChanged(auto_revoke, [this](auto const &, AccelerometerReadingChangedEventArgs const &args) {
          auto reading = args.Reading();
          Send("accelerometer", JSValueObject{{"x", reading.AccelerationX()}, {"y", reading.AccelerationY()}, {"z", reading.AccelerationZ()}, {"timestamp", Seconds(reading.Timestamp())}});
        }));
        started.sensor = sensor;
      } else if (kind == "gyroscope") {
        auto sensor = Gyrometer::GetDefault();
        if (!sensor) return;
        sensor.ReportInterval(Interval(sensor.MinimumReportInterval(), intervalMs));
        started.revoker = Keep(sensor.ReadingChanged(auto_revoke, [this](auto const &, GyrometerReadingChangedEventArgs const &args) {
          auto reading = args.Reading();
          Send("gyroscope", JSValueObject{{"x", Radians(reading.AngularVelocityX())}, {"y", Radians(reading.AngularVelocityY())}, {"z", Radians(reading.AngularVelocityZ())}, {"timestamp", Seconds(reading.Timestamp())}});
        }));
        started.sensor = sensor;
      } else if (kind == "magnetometer" || kind == "magnetometerUncalibrated") {
        auto sensor = Magnetometer::GetDefault();
        if (!sensor) return;
        sensor.ReportInterval(Interval(sensor.MinimumReportInterval(), intervalMs));
        started.revoker = Keep(sensor.ReadingChanged(auto_revoke, [this, kind](auto const &, MagnetometerReadingChangedEventArgs const &args) {
          auto reading = args.Reading();
          Send(kind.c_str(), JSValueObject{{"x", reading.MagneticFieldX()}, {"y", reading.MagneticFieldY()}, {"z", reading.MagneticFieldZ()}, {"timestamp", Seconds(reading.Timestamp())}});
        }));
        started.sensor = sensor;
      } else if (kind == "barometer") {
        auto sensor = Barometer::GetDefault();
        if (!sensor) return;
        sensor.ReportInterval(Interval(sensor.MinimumReportInterval(), intervalMs));
        started.revoker = Keep(sensor.ReadingChanged(auto_revoke, [this](auto const &, BarometerReadingChangedEventArgs const &args) {
          auto reading = args.Reading();
          Send("barometer", JSValueObject{{"pressure", reading.StationPressureInHectopascals()}, {"timestamp", Seconds(reading.Timestamp())}});
        }));
        started.sensor = sensor;
      } else if (kind == "light") {
        auto sensor = LightSensor::GetDefault();
        if (!sensor) return;
        sensor.ReportInterval(Interval(sensor.MinimumReportInterval(), intervalMs));
        started.revoker = Keep(sensor.ReadingChanged(auto_revoke, [this](auto const &, LightSensorReadingChangedEventArgs const &args) {
          auto reading = args.Reading();
          Send("light", JSValueObject{{"illuminance", reading.IlluminanceInLux()}, {"timestamp", Seconds(reading.Timestamp())}});
        }));
        started.sensor = sensor;
      } else if (kind == "pedometer") {
        Pedometer sensor{nullptr};
        {
          std::lock_guard lock(m_mutex);
          sensor = m_pedometer;
        }
        if (!sensor) return;
        sensor.ReportInterval(Interval(sensor.MinimumReportInterval(), intervalMs));
        started.revoker = Keep(sensor.ReadingChanged(auto_revoke, [this](auto const &, PedometerReadingChangedEventArgs const &args) {
          auto reading = args.Reading();
          Send("pedometer", JSValueObject{{"steps", reading.CumulativeSteps()}, {"timestamp", Seconds(reading.Timestamp())}});
        }));
        started.sensor = sensor;
      } else if (kind == "deviceMotion") {
        auto sensor = Accelerometer::GetDefault();
        if (!sensor) return;
        sensor.ReportInterval(Interval(sensor.MinimumReportInterval(), intervalMs));
        Accelerometer linear{nullptr};
        try {
          linear = Accelerometer::GetDefault(AccelerometerReadingType::Linear);
        } catch (...) {
        }
        auto gyrometer = Gyrometer::GetDefault();
        auto inclinometer = Inclinometer::GetDefault();
        started.revoker = Keep(sensor.ReadingChanged(auto_revoke, [this, linear, gyrometer, inclinometer, intervalMs](auto const &, AccelerometerReadingChangedEventArgs const &args) {
          auto reading = args.Reading();
          const double timestamp = Seconds(reading.Timestamp());
          JSValueObject motion{
              {"accelerationIncludingGravity", JSValueObject{{"x", reading.AccelerationX() * kGravity}, {"y", reading.AccelerationY() * kGravity}, {"z", reading.AccelerationZ() * kGravity}, {"timestamp", timestamp}}},
              {"acceleration", nullptr},
              {"rotation", JSValueObject{{"alpha", 0.0}, {"beta", 0.0}, {"gamma", 0.0}, {"timestamp", timestamp}}},
              {"rotationRate", nullptr},
              {"orientation", 0},
              {"interval", intervalMs},
              {"timestamp", timestamp},
          };
          try {
            if (linear) {
              auto now = linear.GetCurrentReading();
              if (now) motion["acceleration"] = JSValueObject{{"x", now.AccelerationX() * kGravity}, {"y", now.AccelerationY() * kGravity}, {"z", now.AccelerationZ() * kGravity}, {"timestamp", timestamp}};
            }
            if (gyrometer) {
              auto now = gyrometer.GetCurrentReading();
              if (now) motion["rotationRate"] = JSValueObject{{"alpha", now.AngularVelocityZ()}, {"beta", now.AngularVelocityX()}, {"gamma", now.AngularVelocityY()}, {"timestamp", timestamp}};
            }
            if (inclinometer) {
              auto now = inclinometer.GetCurrentReading();
              if (now) motion["rotation"] = JSValueObject{{"alpha", Radians(now.YawDegrees())}, {"beta", Radians(now.PitchDegrees())}, {"gamma", Radians(now.RollDegrees())}, {"timestamp", timestamp}};
            }
          } catch (...) {
          }
          Send("deviceMotion", std::move(motion));
        }));
        started.sensor = sensor;
      } else {
        return;
      }
      std::lock_guard lock(m_mutex);
      m_started[kind] = std::move(started);
    } catch (...) {
      // The sensor reports nothing: it went away.
    }
  }

  REACT_METHOD(Stop, L"stop")
  void Stop(std::string kind) noexcept {
    std::lock_guard lock(m_mutex);
    m_started.erase(kind);
  }

  /** The steps the system counted between two moments (milliseconds since 1970), over its history. */
  REACT_METHOD(GetStepCount, L"getStepCount")
  void GetStepCount(double startMs, double endMs, ReactPromise<double> promise) noexcept {
    try {
      {
        std::lock_guard lock(m_mutex);
        if (!m_pedometer) {
          promise.Reject("This machine has no pedometer");
          return;
        }
      }
      const auto from = DateTime{std::chrono::duration_cast<DateTime::duration>(std::chrono::milliseconds(static_cast<int64_t>(startMs))) + DateTime::duration{116444736000000000LL}};
      const auto duration = std::chrono::milliseconds(static_cast<int64_t>(std::max(endMs - startMs, 0.0)));
      Pedometer::GetSystemHistoryAsync(from, duration).Completed([promise](auto const &operation, auto) {
        try {
          std::map<PedometerStepKind, std::pair<int32_t, int32_t>> spans;
          for (auto const &reading : operation.GetResults()) {
            auto &span = spans[reading.StepKind()];
            if (span.first == 0 && span.second == 0) span.first = reading.CumulativeSteps();
            span.second = reading.CumulativeSteps();
          }
          double steps = 0;
          for (auto const &[kind, span] : spans) steps += std::max(span.second - span.first, 0);
          promise.Resolve(steps);
        } catch (hresult_error const &error) {
          promise.Reject(Message(error).c_str());
        }
      });
    } catch (hresult_error const &error) {
      promise.Reject(Message(error).c_str());
    }
  }

 private:
  /** A started sensor and the revoker of its reading event, whatever the sensor's type. */
  struct Started {
    winrt::Windows::Foundation::IInspectable sensor{nullptr};
    std::shared_ptr<void> revoker;
  };

  template <typename Revoker>
  static std::shared_ptr<void> Keep(Revoker &&revoker) {
    return std::make_shared<std::decay_t<Revoker>>(std::forward<Revoker>(revoker));
  }

  void Send(char const *kind, JSValueObject reading) noexcept {
    try {
      reading["kind"] = kind;
      OnSensorReading(std::move(reading));
    } catch (...) {
    }
  }

  ReactContext m_context;
  std::mutex m_mutex;
  Pedometer m_pedometer{nullptr};
  std::map<std::string, Started> m_started;
};
