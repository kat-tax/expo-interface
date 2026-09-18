#include "pch.h"
#ifdef RNW_NEW_ARCH

#include "Common.h"
#include "Islands.h"
#include "codegen/react/components/ExpoWindowsSpec/ExpoWindowsMapView.g.h"

#include <NativeModules.h>

namespace winrt::ExpoWindows {

using namespace winrt::Windows::Devices::Geolocation;
using namespace winrt::Windows::Data::Json;

namespace {

Geopoint PointOf(double latitude, double longitude) {
  return Geopoint{BasicGeoposition{latitude, longitude, 0}};
}

} // namespace

/**
 * `ExpoWindowsMapView`: a WinUI 3 `MapControl` in an island — the view
 * behind `expo-maps` on Windows. It shows the map at the centre and zoom
 * given, with the markers as map icons on an elements layer (a click on
 * one is `onMarkerClick` with its id), interactive controls when asked,
 * and tiles through the Azure Maps key it is given as the service token;
 * without one the control says so itself. The control is a web control
 * underneath and takes nothing before it has loaded, so what the props
 * ask is kept until then and applied at `Loaded`, which is `onLoaded`.
 * Shapes are not among the control's elements.
 */
struct MapView : winrt::implements<MapView, winrt::IInspectable>,
                 Codegen::BaseExpoWindowsMapView<MapView>,
                 XamlIsland<MapView> {
  void InitializeIsland(const composition::ContentIslandComponentView &islandView) noexcept {
    m_map = controls::MapControl{};
    m_map.HorizontalAlignment(xaml::HorizontalAlignment::Stretch);
    m_map.VerticalAlignment(xaml::VerticalAlignment::Stretch);
    m_loaded = m_map.Loaded(winrt::auto_revoke, [weak = get_weak()](winrt::IInspectable const &, xaml::RoutedEventArgs const &) {
      if (auto self = weak.get()) self->Ready();
    });
    Attach(islandView, m_map);
  }

  void UpdateProps(
      const rn::ComponentView &view,
      const winrt::com_ptr<Codegen::ExpoWindowsMapViewProps> &newProps,
      const winrt::com_ptr<Codegen::ExpoWindowsMapViewProps> &oldProps) noexcept override {
    Codegen::BaseExpoWindowsMapView<MapView>::UpdateProps(view, newProps, oldProps);
    if (!newProps) return;
    m_token = newProps->serviceToken.value_or("");
    m_interactive = newProps->interactive;
    m_latitude = newProps->latitude.value_or(0.0);
    m_longitude = newProps->longitude.value_or(0.0);
    m_zoom = newProps->zoom.value_or(1.0);
    m_markers = newProps->markers.value_or("");
    if (m_ready) Apply();
  }

  void HandleSetCameraCommand(double latitude, double longitude, double zoom) noexcept override {
    m_latitude = latitude;
    m_longitude = longitude;
    if (zoom > 0) m_zoom = zoom;
    if (m_ready) Apply();
  }

 private:
  /** The control has loaded: its layer and click come now, and then whatever the props asked for. */
  void Ready() noexcept {
    if (m_ready) return;
    m_ready = true;
    try {
      m_layer = controls::MapElementsLayer{};
      m_map.Layers().Append(m_layer);
      m_click = m_map.MapElementClick(winrt::auto_revoke, [weak = get_weak()](controls::MapControl const &, controls::MapElementClickEventArgs const &args) {
        if (auto self = weak.get()) self->Clicked(args.Element());
      });
    } catch (winrt::hresult_error const &) {
    }
    Apply();
    if (auto emitter = EventEmitter()) emitter->onLoaded(Codegen::ExpoWindowsMapViewSpec_onLoaded{});
  }

  /** What the props ask for, on the loaded control; the markers only when they changed. */
  void Apply() noexcept {
    try {
      if (m_token != m_appliedToken) {
        m_map.MapServiceToken(::ExpoWindows::ToWide(m_token));
        m_appliedToken = m_token;
      }
      m_map.InteractiveControlsVisible(m_interactive);
      m_map.Center(PointOf(m_latitude, m_longitude));
      m_map.ZoomLevel(m_zoom);
      if (m_markers != m_appliedMarkers) {
        Markers(m_markers);
        m_appliedMarkers = m_markers;
      }
    } catch (winrt::hresult_error const &) {
    }
  }

  /** The markers as JSON, each a map icon by its id on the layer (the control's icons carry no title). */
  void Markers(std::string const &json) {
    if (!m_layer) return;
    m_layer.MapElements().Clear();
    m_icons.clear();
    if (json.empty()) return;
    JsonArray array;
    if (!JsonArray::TryParse(::ExpoWindows::ToWide(json), array)) return;
    for (auto const &item : array) {
      if (item.ValueType() != JsonValueType::Object) continue;
      auto marker = item.GetObject();
      controls::MapIcon icon;
      icon.Location(PointOf(marker.GetNamedNumber(L"latitude", 0), marker.GetNamedNumber(L"longitude", 0)));
      m_layer.MapElements().Append(icon);
      m_icons.emplace_back(::ExpoWindows::ToUtf8(marker.GetNamedString(L"id", L"")), icon);
    }
  }

  void Clicked(controls::MapElement const &element) noexcept {
    for (auto const &[id, icon] : m_icons) {
      if (icon == element) {
        if (auto emitter = EventEmitter()) emitter->onMarkerClick(Codegen::ExpoWindowsMapViewSpec_onMarkerClick{id});
        return;
      }
    }
  }

  controls::MapControl m_map{nullptr};
  controls::MapElementsLayer m_layer{nullptr};
  controls::MapControl::MapElementClick_revoker m_click;
  xaml::FrameworkElement::Loaded_revoker m_loaded;
  std::vector<std::pair<std::string, controls::MapIcon>> m_icons;
  bool m_ready{false};
  bool m_interactive{true};
  double m_latitude{0};
  double m_longitude{0};
  double m_zoom{1};
  std::string m_token;
  std::string m_appliedToken{"\x01"};
  std::string m_markers;
  std::string m_appliedMarkers{"\x01"};
};

void RegisterMapView(const rn::IReactPackageBuilder &packageBuilder) noexcept {
  RegisterIsland<MapView>(packageBuilder, &Codegen::RegisterExpoWindowsMapViewNativeComponent<MapView>);
}

} // namespace winrt::ExpoWindows

#endif // RNW_NEW_ARCH
